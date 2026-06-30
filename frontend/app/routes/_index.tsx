import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/card"
import { Input } from "@/components/input"
import { Button } from "@/components/button"
  
function chat() {
 function handleSend() {
    return
 }

 
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-4">
        <Card className="flex h-full max-h-125 w-full max-w-125 flex-col shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800"></CardTitle>
        </CardHeader>

      </Card>
    </div>
  )

}

export default chat
