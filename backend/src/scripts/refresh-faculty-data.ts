import { connectDatabase, disconnectDatabase } from "../config/database";
import { TeacherModel } from "../modules/teacher/teacher.model";
import { UserModel } from "../modules/user/user.model";

const faculty = [
  ["Ahsan", "Kabir", "Artificial Intelligence", "Machine Learning"],
  ["Nusrat", "Jahan", "Data Science", "Natural Language Processing"],
  ["Tanvir", "Ahmed", "Software Engineering", "Distributed Systems"],
  ["Farzana", "Rahman", "Cyber Security", "Digital Forensics"],
  ["Mahmudul", "Hasan", "Computer Networks", "Cloud Computing"],
  ["Sadia", "Islam", "Database Systems", "Information Retrieval"],
  ["Imran", "Hossain", "Business Analytics", "Operations Management"],
  ["Tahmina", "Akter", "Finance", "Corporate Governance"],
  ["Rafiq", "Uddin", "Marketing", "Consumer Behaviour"],
  ["Samira", "Chowdhury", "Human Resource Management", "Organizational Behaviour"],
  ["Arif", "Mahmud", "Constitutional Law", "Human Rights Law"],
  ["Sharmeen", "Sultana", "Corporate Law", "International Law"],
  ["Faisal", "Karim", "Criminal Law", "Legal Research"],
  ["Nabila", "Haque", "Architectural Design", "Urban Planning"],
  ["Samiul", "Bashar", "Sustainable Architecture", "Building Technology"],
  ["Mehnaz", "Ahmed", "Landscape Architecture", "Heritage Conservation"],
  ["Kamrul", "Alam", "Structural Engineering", "Earthquake Engineering"],
  ["Tasnim", "Ara", "Transportation Engineering", "Urban Mobility"],
  ["Mizanur", "Rahman", "Geotechnical Engineering", "Foundation Design"],
  ["Rumana", "Yasmin", "Environmental Engineering", "Water Resources"],
  ["Shafiq", "Hasan", "Construction Management", "Project Planning"],
  ["Maliha", "Noor", "Applied Mathematics", "Numerical Analysis"],
  ["Zahid", "Iqbal", "Physics", "Materials Science"],
  ["Afroza", "Begum", "Chemistry", "Environmental Chemistry"],
  ["Rezaul", "Haque", "Economics", "Development Economics"],
  ["Ishrat", "Jahan", "English", "Applied Linguistics"],
  ["Saiful", "Islam", "Statistics", "Statistical Learning"],
  ["Lubna", "Karim", "Public Administration", "Policy Analysis"],
  ["Omar", "Faruk", "Electrical Engineering", "Renewable Energy"],
  ["Mousumi", "Das", "Electronics", "Embedded Systems"],
  ["Adnan", "Siddique", "Mechanical Engineering", "Thermal Engineering"],
  ["Raisa", "Khan", "Industrial Engineering", "Supply Chain Optimization"],
] as const;

async function main() {
  await connectDatabase();
  const teachers = await TeacherModel.find().populate("user").sort({ employeeId: 1 });
  let updated = 0;

  for (const [index, teacher] of teachers.entries()) {
    const user = await UserModel.findById(teacher.user);
    if (!user) continue;
    const profile = faculty[index % faculty.length]!;
    const sequence = String(index + 1).padStart(3, "0");
    user.firstName = profile[0];
    user.lastName = profile[1];
    user.email = `faculty${sequence}@unisphere.edu.bd`;
    user.phone = `+8801700${String(index + 1).padStart(6, "0")}`;
    await user.save();

    teacher.employeeId = `FAC-${sequence}`;
    teacher.officialEmail = user.email;
    teacher.phone = user.phone;
    teacher.specialization = [profile[2]];
    teacher.researchInterests = [profile[3]];
    teacher.employmentType = teacher.designation === "adjunct" ? "adjunct" : "permanent";
    teacher.maxWeeklyHours = teacher.designation === "professor" ? 12 : 18;
    teacher.campus = "Main Campus";
    teacher.officeRoom = `Faculty Block ${String.fromCharCode(65 + (index % 5))}-${200 + index}`;
    teacher.set("qualifications", [
      { degree: `PhD in ${profile[2]}`, institution: "University of Dhaka", year: 2014 + (index % 10) },
      { degree: `MSc in ${profile[2]}`, institution: "Bangladesh University of Engineering and Technology", year: 2009 + (index % 10) },
    ]);
    await teacher.save();
    updated += 1;
  }

  console.info(`Faculty data refreshed: ${updated} professional profiles updated; existing allocations preserved.`);
}

main().finally(disconnectDatabase).catch((error) => { console.error(error); process.exitCode = 1; });
