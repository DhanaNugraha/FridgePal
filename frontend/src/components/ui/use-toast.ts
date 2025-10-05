import * as React from "react"

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
  onDismiss?: () => void
  open?: boolean
  _action?: ToastAction // Internal use only
}

type ToastState = {
  toasts: Toast[]
}

type ToastActionType = 
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'UPDATE_TOAST'; toast: Partial<Toast> & { id: string } }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId?: string }

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: 'REMOVE_TOAST',
      toastId,
    })
  }, 1000)

  toastTimeouts.set(toastId, timeout)
}

function reducer(state: ToastState, action: ToastActionType): ToastState {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.toast],
      }
    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }
    case 'DISMISS_TOAST': {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          !toastId || t.id === toastId
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
    default:
      return state
  }
}

const listeners: Array<(state: ToastState) => void> = []

let memoryState: ToastState = { toasts: [] }

function dispatch(action: ToastActionType) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type ToastInput = Omit<Toast, 'id' | 'action' | '_action'> & {
  action?: ToastAction;
}

function toast({ action, ...props }: ToastInput) {
  const id = genId()

  const update = (updateProps: ToastInput) => {
    // Create a sanitized update object without the action
    const { action: updateAction, ...rest } = updateProps;
    const toastUpdate: Partial<Toast> & { id: string } = { ...rest, id };
    
    // If there's an action in the update, store it in _action
    if (updateAction) {
      toastUpdate._action = updateAction;
      // Create the action button
      toastUpdate.action = React.createElement(
        'button',
        {
          key: `toast-action-${id}`,
          type: 'button',
          onClick: () => {
            updateAction.onClick();
            dismiss();
          },
          className: "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive"
        },
        updateAction.label
      );
    } else if ('action' in updateProps) {
      // If action is explicitly set to undefined, remove it
      toastUpdate.action = undefined;
      toastUpdate._action = undefined;
    }

    dispatch({
      type: 'UPDATE_TOAST',
      toast: toastUpdate,
    });
  }

  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id })

  const handleActionClick = React.useCallback(() => {
    if (action) {
      action.onClick()
      dismiss()
    }
  }, [action, dismiss])

  const toastData: Toast = {
    ...props,
    id,
    open: true,
    onDismiss: dismiss,
  }

  if (action) {
    // Store the action for internal use
    toastData._action = action;
    
    // Create the button element
    toastData.action = React.createElement(
      'button',
      {
        key: `toast-action-${id}`,
        type: 'button',
        onClick: handleActionClick,
        className: "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive"
      },
      action.label
    )
  }

  dispatch({
    type: 'ADD_TOAST',
    toast: toastData,
  })

  return {
    id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  }
}

export { useToast, toast }
