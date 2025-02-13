"use client"

import Link from "next/link"
import { Github, Linkedin, FileText, ArrowUpRight, Send } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Page() {
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [inputMessage, setInputMessage] = useState("")

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      setChatMessages([...chatMessages, { role: "user", content: inputMessage }])
      // Here you would typically call an API to get the AI response
      // For now, we'll just echo the message
      setTimeout(() => {
        setChatMessages((prev) => [...prev, { role: "assistant", content: `You said: ${inputMessage}` }])
      }, 500)
      setInputMessage("")
    }
  }

  return (
    <main className="min-h-screen bg-white text-black  max-w-6xl mx-auto px-6">
      {/* Scrolling banner */}
      <div className="w-full border-b border-black bg-white">
        <div className="relative overflow-hidden h-8">
          <motion.div
            className="whitespace-nowrap text-sm"
            animate={{
              x: ["0%", "-50%"],
            }}
            transition={{
              x: {
                duration: 20,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              },
            }}
          >
            <span className="inline-block px-20">BUILD BUILD BUILD</span>
            <span className="inline-block px-20">BUILD BUILD BUILD</span>
            <span className="inline-block px-20">BUILD BUILD BUILD</span>
          </motion.div>
        </div>
      </div>

      {/* Header navigation */}
      <div className="w-full border-b border-black bg-white max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center px-6 h-8 text-xs">
          <div><a target="_blank" href="https://github.com/lundeen06">GITHUB.COM/LUNDEEN06</a></div>
          <div>COMING SOON: BUILD BUILD BUILD</div>
          <div><a target="_blank" href="https://x.com/lundeen06">X.COM/LUNDEEN06</a></div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto">
        {/* Hero section */}
        <div className="grid grid-cols-3 gap-6 py-12">
          <div className="col-span-2 grid gap-6">
            <h1 className="text-[6rem] font-bold leading-none">LUNDEEN</h1>
            <div className="grid gap-4 text-sm leading-relaxed">
              <p>space, ai, xr | engineering physics + cs @ stanford</p>
              <p>exploring the intersection of artificial intelligence, space tech, and extended reality</p>
            </div>
          </div>
          <div className="col-span-1">
            {/* Reserved for future image */}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-black mb-6"></div>

        {/* Projects section */}
        <div className="mb-12">
          <h2 className="text-sm mb-6">PROJECTS</h2>
          <div className="grid grid-cols-2 gap-6">
            {[
              {
                title: "AI Distributed Satellite GNC Manager",
                description: "Manage satellite constellations w/ future-oriented goals incl. data centers, chip manufacturing, asteroid retrieval, etc.",
                link: "#ai-constellation-manager",
              },
              {
                title: "SAMWISE Satellite GNC Systems",
                description: "Flight code and physics-based simulations for our 2u CubeSat 'SAWMISE' @ Stanford Space Initiative",
                link: "#samwse-gnc",
              },
              {
                title: "XR Motion Tracking",
                description: "Computer vision systems for tracking human movement in multimodal XR interfaces @ Stanford VHIL",
                link: "#vhil-xr-mocap",
              },
              {
                title: "HEIMDALL (whitepaper)",
                description: "DAO providing decentralized compute to information sensitive tech",
                link: "#heimdall",
              },
            ].map((project, index) => (
              <Link
                key={index}
                href={project.link}
                className="group grid gap-2 hover:bg-black hover:text-white p-4 transition-colors"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span>{project.title}</span>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs opacity-70">{project.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-black my-6"></div>

        {/* Writing section */}
        <div className="mb-12">
          <h2 className="text-sm mb-6">WRITING</h2>
          <div className="grid grid-cols-2 gap-6">
            {[
              {
                title: "Low-Order Magnetic Field Models for Satellite ADCS",
                description: "Technical deep-dive into using spherical harmonics for on-board magnetic field modeling",
                link: "#",
              },
              {
                title: "The Untapped Potential of XR in Physics Education",
                description: "Enhancing understanding through immersive experiences",
                link: "#",
              },
              {
                title: "Physics-Based AI: Merging Scientific Knowledge with Machine Learning",
                description: "Integrating physical laws into AI models for better predictions",
                link: "#",
              },
              {
                title: "Distributed Satellite GNC and ",
                description: "Integrating physical laws into AI models for better predictions",
                link: "#",
              },
            ].map((article, index) => (
              <Link
                key={index}
                href={article.link}
                className="group grid gap-2 hover:bg-black hover:text-white p-4 transition-colors"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span>{article.title}</span>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs opacity-70">{article.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-black my-6"></div>

        

        {/* AI Chatbot */}
        <div className="mb-12">
          <h2 className="text-sm mb-6">LUNDEEN.AI</h2>
          <div className="border border-black p-4">
            <div className="h-64 overflow-y-auto mb-4">
              {chatMessages.map((message, index) => (
                <div key={index} className={`mb-2 ${message.role === "user" ? "text-right" : "text-left"}`}>
                  <span className="inline-block bg-black text-white p-2 text-xs">{message.content}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Ask me anything about AI, XR, or Physics..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-grow text-xs"
              />
              <Button onClick={handleSendMessage} className="bg-black text-white hover:bg-white hover:text-black">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-black my-6"></div>

        {/* Connect section */}
        <div className="mb-12">
          <h2 className="text-sm mb-6">CONNECT</h2>
          <div className="grid grid-cols-3 gap-4">
            <Link
              href="https://github.com/lundeen06"
              target="_blank"
              className="flex items-center gap-2 text-sm hover:bg-black hover:text-white p-4 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              href="https://linkedin.com/in/lundeencahilly"
              target="_blank"
              className="flex items-center gap-2 text-sm hover:bg-black hover:text-white p-4 transition-colors"
            >
              <Linkedin className="w-4 h-4" />
              <span>LinkedIn</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              href="/resume.pdf"
              target="_blank"
              className="flex items-center gap-2 text-sm hover:bg-black hover:text-white p-4 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Resume</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-black py-12">
          <div className="text-xs text-center opacity-70">
            © {new Date().getFullYear()} Lundeen Cahilly
          </div>
        </footer>
      </div>
    </main>
  )
}

