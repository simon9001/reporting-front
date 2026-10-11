import { Mail } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useSettings } from '../../api/config'
import { useEmailStatus, useSendTestEmail } from '../../api/email'
import { Alert, Button, Card } from '../../components/ui'
import { errorMessage } from '../../lib/api'

export function EmailCard() {
  const status = useEmailStatus()
  const settings = useSettings()
  const test = useSendTestEmail()
  const [done, setDone] = useState(false)
  const s = status.data
  return (
    <Card title="Email" actions={<Button variant="secondary" disabled={test.isPending} onClick={() => test.mutate(undefined, { onSuccess: () => setDone(true) })}><Mail />Send test email</Button>}>
      <div className="space-y-2 text-[13px]">
        {status.isError && <Alert>{errorMessage(status.error)}</Alert>}
        {s && (s.configured
          ? <p>SMTP configured: <strong>Yes</strong> ({s.host}{s.from ? `, from ${s.from}` : ''})</p>
          : <p>SMTP configured: <strong>No</strong> — set <code>SR_SMTP_HOST</code> and the other <code>SR_SMTP_*</code> values in the backend <code>.env</code>. Until then emails are logged as skipped.</p>)}
        {settings.data && settings.data.ddEmails.length === 0 && <Alert tone="warning">No Deputy Director email address is set in System settings, so submitted reports cannot be emailed.</Alert>}
        {done && <Alert tone="success">Test email queued to your address. Check the <Link to="/admin/email-log" className="font-medium underline">Email log</Link>.</Alert>}
        {test.isError && <Alert>{errorMessage(test.error)}</Alert>}
      </div>
    </Card>
  )
}
