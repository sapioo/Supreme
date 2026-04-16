import * as React from "react"
import { Mic, Send } from "lucide-react"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export const PromptBox = React.forwardRef(function PromptBox(
  {
    className,
    onSubmit,
    value,
    onChange,
    disabled = false,
    submitDisabled = false,
    minLength = 20,
    placeholder = "Message...",
    submitLabel = "Submit Argument",
    ...props
  },
  ref
) {
  const textareaRef = React.useRef(null)
  const [internalValue, setInternalValue] = React.useState("")

  React.useImperativeHandle(ref, () => textareaRef.current, [])

  const currentValue = value ?? internalValue

  React.useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }, [currentValue])

  const trimmed = currentValue.trim()
  const canSubmit = !submitDisabled && trimmed.length >= minLength

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!canSubmit) return
    onSubmit?.(trimmed)
    if (value === undefined) {
      setInternalValue("")
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex flex-col rounded-[24px] border border-zinc-700 bg-zinc-900 p-2 shadow-none transition-colors",
        disabled && "opacity-60",
        className
      )}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={currentValue}
        onChange={(event) => {
          if (value === undefined) {
            setInternalValue(event.target.value)
          }
          onChange?.(event)
        }}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            handleSubmit(event)
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-12 w-full resize-none border-0 bg-transparent p-3 text-zinc-100 placeholder:text-zinc-500 focus:ring-0 focus-visible:outline-none"
        {...props}
      />

      <div className="px-1 pb-1">
        <TooltipProvider delayDuration={120}>
          <div className="flex items-center justify-end gap-2">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send message</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top"><p>Send</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    disabled={disabled}
                    className="flex h-8 items-center gap-1.5 rounded-full border border-zinc-700 px-3 text-xs font-medium uppercase tracking-wider text-zinc-300 transition-colors hover:bg-zinc-800 focus-visible:outline-none disabled:opacity-40"
                  >
                    <Mic className="h-3.5 w-3.5" />
                    Use Voice
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top"><p>Use Voice</p></TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      </div>


    </form>
  )
})
