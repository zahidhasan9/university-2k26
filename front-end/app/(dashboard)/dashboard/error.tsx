"use client"
import {AlertTriangle,RotateCcw} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Card,CardContent} from "@/components/ui/card"
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){return <div className="mx-auto grid min-h-[60vh] max-w-xl place-items-center"><Card className="w-full"><CardContent className="p-8 text-center"><AlertTriangle className="mx-auto size-10 text-destructive"/><h1 className="mt-5 text-xl font-bold">This workspace could not be loaded</h1><p className="mt-2 text-sm text-muted-foreground">Check the backend connection and your account permissions, then try again.</p><Button className="mt-6" onClick={reset}><RotateCcw/>Try again</Button></CardContent></Card></div>}
