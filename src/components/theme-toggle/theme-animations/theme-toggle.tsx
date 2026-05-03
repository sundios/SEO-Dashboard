"use client"

import React from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { ButtonDescendant } from "@/components/ui/button-descendant"

import {
    AnimationStart,
    AnimationVariant,
    createAnimation,
} from "./theme-animations"

interface ThemeToggleAnimationProps {
    variant?: AnimationVariant
    start?: AnimationStart
    showLabel?: boolean
    url?: string
}

export function ThemeToggleButton({
    variant = "circle-blur",
    start = "top-left",
    showLabel = false,
    url = "",
}: ThemeToggleAnimationProps) {
    const { theme, setTheme } = useTheme()

    const styleId = "theme-transition-styles"

    const updateStyles = React.useCallback((css: string, name: string) => {
        if (typeof window === "undefined") return

        let styleElement = document.getElementById(styleId) as HTMLStyleElement

        console.log("style ELement", styleElement)
        console.log("name", name)

        if (!styleElement) {
            styleElement = document.createElement("style")
            styleElement.id = styleId
            document.head.appendChild(styleElement)
        }

        styleElement.textContent = css

        console.log("content updated")
    }, [])

    const toggleTheme = React.useCallback(() => {
        const animation = createAnimation(variant, start, url)

        updateStyles(animation.css, animation.name)

        if (typeof window === "undefined") return

        const switchTheme = () => {
            setTheme(theme === "light" ? "dark" : "light")
        }

        if (!document.startViewTransition) {
            switchTheme()
            return
        }

        document.startViewTransition(switchTheme)
    }, [theme, setTheme])

    return (
        <ButtonDescendant
            onClick={toggleTheme}
            variant="ghost"
            size="icon"
            className="w-8 p-0 h-8 relative group"
            // name="Theme Toggle Button"
        >
            <SunIcon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Theme Toggle </span>
            {showLabel && (
                <>
                    <span className="hidden group-hover:block border rounded-full px-2 absolute -top-10">
                        {" "}
                        variant = {variant}
                    </span>
                    <span className="hidden group-hover:block border rounded-full px-2 absolute -bottom-10">
                        {" "}
                        start = {start}
                    </span>
                </>
            )}
        </ButtonDescendant>
    )
}
