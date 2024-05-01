'use client'

import { IconOpenAI } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { spinner } from './spinner'
import { CodeBlock } from '../ui/codeblock'
import { MemoizedReactMarkdown } from '../markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { StreamableValue } from 'ai/rsc'
import { useStreamableText } from '@/lib/hooks/use-streamable-text'
import { FaUserCircle } from "react-icons/fa"
import Image from 'next/image'
// Different types of message bubbles.

export function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="group relative flex flex-col items-start md:-ml-12">
      <div className="flex select-none items-center justify-center">
        <FaUserCircle color='gray' className='size-[24px]' />
        <div className='pl-2'>You</div>
      </div>
      <div className="ml-4 mt-2 flex-1 text-black space-y-2 overflow-hidden p-3 bg-[#eeeaff] w-full rounded-md">
        {children}
      </div>
    </div>
  )
}

export function BotMessage({
  content,
  className
}: {
  content: string | StreamableValue<string>
  className?: string
}) {
  const text = useStreamableText(content)

  return (
    <div className={cn('group relative flex flex-col items-start md:-ml-12', className)}>
      <div className="flex select-none items-center justify-center">
        <Image src={'/Mark.png'} alt='' width={24} height={24} className='size-[24px] rounded-full' />
        <div className='pl-2'>Sender OS</div>
      </div>
      <div className="ml-4 mt-2 flex-1 space-y-2 overflow-hidden p-3 bg-[#eeeaff] w-full rounded-md">
        <MemoizedReactMarkdown
          className="prose break-words prose-p:leading-relaxed prose-pre:p-0"
          remarkPlugins={[remarkGfm, remarkMath]}
          components={{
            p({ children }) {
              return <p className="mb-2 text-black last:mb-0">{children}</p>
            },
            code({ node, inline, className, children, ...props }) {
              if (children.length) {
                if (children[0] == '▍') {
                  return (
                    <span className="mt-1 animate-pulse cursor-default">▍</span>
                  )
                }

                children[0] = (children[0] as string).replace('`▍`', '▍')
              }

              const match = /language-(\w+)/.exec(className || '')

              if (inline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }

              return (
                <CodeBlock
                  key={Math.random()}
                  language={(match && match[1]) || ''}
                  value={String(children).replace(/\n$/, '')}
                  {...props}
                />
              )
            }
          }}
        >
          {text}
        </MemoizedReactMarkdown>
      </div>
    </div>
  )
}

export function BotCard({
  children,
  showAvatar = true
}: {
  children: React.ReactNode
  showAvatar?: boolean
}) {
  return (
    <div className="group relative flex items-start md:-ml-12">
      <div
        className={cn(
          'flex select-none items-center justify-center ',
          !showAvatar && 'invisible'
        )}
      >
        <Image src={'/Mark.png'} alt='' width={24} height={24} className='size-[24px] rounded-full' />
        <div className='pl-2'>Sender OS</div>
      </div>
      <div className="ml-4 mt-2 flex-1 space-y-2 overflow-hidden p-3 bg-[#eeeaff] w-full rounded-md">{children}</div>
    </div>
  )
}

export function SystemMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={
        'mt-2 flex items-center justify-center gap-2 text-xs text-gray-500'
      }
    >
      <div className={'max-w-[600px] flex-initial p-2'}>{children}</div>
    </div>
  )
}

export function SpinnerMessage() {
  return (
    <div className="group relative flex items-start md:-ml-12">
      <div className="flex select-none items-center justify-center rounded-md ">
        <Image src={'/Mark.png'} alt='' width={24} height={24} className='size-[24px] rounded-full' />
        <div className='pl-2'>Sender OS</div>
      </div>
      <div className="ml-4 h-[24px] flex flex-row items-center flex-1 space-y-2 overflow-hidden px-1">
        {spinner}
      </div>
    </div>
  )
}
