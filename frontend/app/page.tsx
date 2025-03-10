import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Heart } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30">
      <div className="text-center space-y-6 max-w-3xl px-4">
        <div className="flex items-center justify-center mb-6">
          <Heart className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold">Mortuary Management System</h1>
        <p className="text-xl text-muted-foreground">
          A comprehensive system designed to manage all aspects of mortuary operations with respect and efficiency.
        </p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/login">Get Started</Link>
        </Button>
      </div>
    </div>
  )
}

