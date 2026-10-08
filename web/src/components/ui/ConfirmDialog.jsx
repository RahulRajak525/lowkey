import { useId } from 'react'
import Button from './Button'
import Dialog from './Dialog'

/**
 * In-app replacement for window.confirm. Cancel takes initial focus, so a
 * stray Enter never confirms something destructive.
 */
const ConfirmDialog = ({
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
  isPending = false,
  onConfirm,
  onClose,
}) => {
  const titleId = useId()

  return (
    <Dialog onClose={onClose} labelledBy={titleId} className="max-w-sm">
      <div className="p-5 sm:p-6">
        <h2 id={titleId} className="text-title font-semibold text-fg">
          {title}
        </h2>
        {description ? <p className="mt-2 text-ui text-fg-2">{description}</p> : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} autoFocus>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={isPending} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

export default ConfirmDialog
