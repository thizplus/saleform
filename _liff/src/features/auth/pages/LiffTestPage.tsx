import { useState } from 'react'
import liff from '@line/liff'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function LiffTestPage() {
  const [sendResult, setSendResult] = useState<string>('')
  const [contextInfo, setContextInfo] = useState<string>('')

  const isInClient = liff.isInClient()
  const isLoggedIn = liff.isLoggedIn()
  const context = liff.getContext()

  function showContext() {
    setContextInfo(JSON.stringify(context, null, 2))
  }

  async function testSendMessage() {
    try {
      if (!context || (context.type !== 'group' && context.type !== 'room' && context.type !== 'utou')) {
        setSendResult('ไม่ได้เปิดจากห้องแชท ส่งข้อความไม่ได้')
        return
      }

      await liff.sendMessages([
        {
          type: 'text',
          text: 'ทดสอบจาก LIFF - ระบบรายงานเซลล์ UP Steel',
        },
      ])
      setSendResult('ส่งข้อความสำเร็จ! ดูในกลุ่ม')
    } catch (err) {
      setSendResult(`ส่งไม่ได้: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  async function testSendFlexCard() {
    try {
      if (!context || (context.type !== 'group' && context.type !== 'room' && context.type !== 'utou')) {
        setSendResult('ไม่ได้เปิดจากห้องแชท ส่งการ์ดไม่ได้')
        return
      }

      const flexMessage = {
        type: 'flex',
        altText: 'ทดสอบการ์ดรายงาน',
        contents: {
          type: 'bubble',
          size: 'kilo',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'งานใหม่ #TEST-01',
                weight: 'bold',
                size: 'lg',
                color: '#1DB446',
              },
            ],
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'ลูกค้า: ทดสอบระบบ',
                size: 'sm',
              },
              {
                type: 'text',
                text: 'โทร: 081-234-5678',
                size: 'sm',
                margin: 'sm',
              },
              {
                type: 'text',
                text: 'รายละเอียด: ทดสอบ Flex Card จาก LIFF',
                size: 'sm',
                margin: 'sm',
                wrap: true,
              },
            ],
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'ส่งจาก LIFF ระบบรายงานเซลล์',
                size: 'xxs',
                color: '#aaaaaa',
                align: 'center',
              },
            ],
          },
        },
      }

      await liff.sendMessages([flexMessage as never])
      setSendResult('ส่ง Flex Card สำเร็จ! ดูในกลุ่ม')
    } catch (err) {
      setSendResult(`ส่ง Flex Card ไม่ได้: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">LIFF Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Badge variant={isInClient ? 'default' : 'secondary'}>
              {isInClient ? 'In LINE App' : 'External Browser'}
            </Badge>
            <Badge variant={isLoggedIn ? 'default' : 'destructive'}>
              {isLoggedIn ? 'Logged In' : 'Not Logged In'}
            </Badge>
            {context && (
              <Badge variant="outline">Context: {context.type}</Badge>
            )}
          </div>

          {!isLoggedIn && (
            <Button onClick={() => liff.login()} className="w-full">
              Login with LINE
            </Button>
          )}

          {isLoggedIn && (
            <>
              <div className="text-sm text-muted-foreground">
                LIFF ID: {liff.id}
              </div>
              <div className="text-sm text-muted-foreground">
                User ID: {context?.userId ?? 'N/A'}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={showContext} variant="outline" className="w-full">
            Show Context
          </Button>

          <Button onClick={testSendMessage} className="w-full">
            Send Test Text
          </Button>

          <Button onClick={testSendFlexCard} variant="secondary" className="w-full">
            Send Test Flex Card
          </Button>

          {contextInfo && (
            <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
              {contextInfo}
            </pre>
          )}

          {sendResult && (
            <div className="text-sm p-3 bg-muted rounded-md">{sendResult}</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
