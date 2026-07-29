import type { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { RoleModel } from "../role/role.model";
import { UserModel } from "../user/user.model";
import { ConversationModel, MessageModel } from "./message.model";
import { NoticeModel } from "./notice.model";
import { NotificationModel } from "./notification.model";
import { enqueueNotification } from "../../jobs/notification.queue";

export async function listNotices(roleIds: string[], includeDrafts: boolean) {
  const now = new Date();
  const filter: Record<string, unknown> = includeDrafts
    ? {}
    : {
        status: "published",
        publishAt: { $lte: now },
        $and: [
          { $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }] },
          {
            $or: [
              { audienceRoles: { $size: 0 } },
              { audienceRoles: { $in: roleIds.map((id) => toObjectId(id, "role id")) } },
            ],
          },
        ],
      };
  return NoticeModel.find(filter)
    .populate("audienceRoles", "code name")
    .populate("createdBy", "firstName lastName")
    .sort({ publishAt: -1 })
    .lean();
}

export async function createNotice(actorId: Types.ObjectId, input: Record<string, unknown>) {
  const roleIds = [...new Set((input.audienceRoleIds as string[]) ?? [])].map((id) => toObjectId(id));
  if ((await RoleModel.countDocuments({ _id: { $in: roleIds } })) !== roleIds.length) {
    throw new AppError(400, "One or more audience roles do not exist");
  }
  const { audienceRoleIds: _, ...data } = input;
  return NoticeModel.create({ ...data, audienceRoles: roleIds, createdBy: actorId });
}

export async function createConversation(
  actorId: Types.ObjectId,
  input: { subject?: string; type: "direct" | "group"; participantUserIds: string[] },
) {
  const participants = [...new Set([actorId.toString(), ...input.participantUserIds])].map((id) =>
    toObjectId(id, "participant id"),
  );
  if (input.type === "direct" && participants.length !== 2) {
    throw new AppError(400, "Direct conversation requires exactly two participants");
  }
  if ((await UserModel.countDocuments({ _id: { $in: participants }, status: "active" })) !== participants.length) {
    throw new AppError(400, "One or more participants are unavailable");
  }
  if (input.type === "direct") {
    const existing = await ConversationModel.findOne({
      type: "direct",
      participants: { $all: participants, $size: 2 },
    });
    if (existing) return existing;
  }
  return ConversationModel.create({
    subject: input.subject,
    type: input.type,
    participants,
    createdBy: actorId,
  });
}
export function listConversations(userId: Types.ObjectId) {
  return ConversationModel.find({ participants: userId })
    .populate("participants", "firstName lastName email")
    .sort({ lastMessageAt: -1 })
    .lean();
}
async function requireConversation(id: string, userId: Types.ObjectId) {
  const conversation = await ConversationModel.findOne({
    _id: toObjectId(id),
    participants: userId,
  });
  if (!conversation) throw new AppError(404, "Conversation not found");
  return conversation;
}
export async function sendMessage(
  conversationId: string,
  userId: Types.ObjectId,
  input: { body: string; attachmentUrls: string[] },
) {
  const conversation = await requireConversation(conversationId, userId);
  const message = await MessageModel.create({
    ...input,
    conversation: conversation._id,
    sender: userId,
    readBy: [userId],
  });
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();
  const recipients = conversation.participants.filter((id) => !id.equals(userId));
  if (recipients.length) {
    await NotificationModel.insertMany(
      recipients.map((recipient) => ({
        user: recipient,
        channel: "in_app",
        type: "message.received",
        title: "New message",
        body: input.body.slice(0, 200),
        data: { conversationId: conversation._id, messageId: message._id },
      })),
    );
  }
  return message;
}
export async function listMessages(conversationId: string, userId: Types.ObjectId, query: Record<string, unknown>) {
  const conversation = await requireConversation(conversationId, userId);
  const { page, limit, skip } = getPagination(query);
  const [items, total] = await Promise.all([
    MessageModel.find({ conversation: conversation._id, status: "visible" })
      .populate("sender", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MessageModel.countDocuments({ conversation: conversation._id, status: "visible" }),
    MessageModel.updateMany(
      { conversation: conversation._id, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } },
    ),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function notifyUser(
  userId: Types.ObjectId,
  type: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  return NotificationModel.create({
    user: userId,
    channel: "in_app",
    type,
    title,
    body,
    data,
    status: "sent",
    sentAt: new Date(),
  });
}
export async function dispatchExternalNotification(input: {
  userId: string;
  channel: "email" | "sms";
  recipient?: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  const user = await UserModel.findOne({
    _id: toObjectId(input.userId, "user id"),
    status: "active",
  }).lean();
  if (!user) throw new AppError(400, "Active notification user not found");
  const recipient = input.channel === "email" ? input.recipient ?? user.email : input.recipient;
  if (!recipient) throw new AppError(400, "Notification recipient is required");
  const notification = await NotificationModel.create({
    user: user._id,
    channel: input.channel,
    recipient,
    type: input.type,
    title: input.title,
    body: input.body,
    data: input.data,
    status: "queued",
  });
  try {
    await enqueueNotification(notification._id.toString());
  } catch (error) {
    console.error("Unable to enqueue notification; retained in outbox", error);
  }
  return notification;
}
export async function listNotifications(userId: Types.ObjectId, query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = { user: userId };
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    NotificationModel.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}
export async function readNotification(id: string, userId: Types.ObjectId) {
  const notification = await NotificationModel.findOneAndUpdate(
    { _id: toObjectId(id), user: userId },
    { $set: { status: "read", readAt: new Date() } },
    { new: true },
  );
  if (!notification) throw new AppError(404, "Notification not found");
  return notification;
}
