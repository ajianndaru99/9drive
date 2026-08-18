import 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'md-filled-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        disabled?: boolean
        type?: 'button' | 'submit' | 'reset'
      }
      'md-outlined-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        disabled?: boolean
        type?: 'button' | 'submit' | 'reset'
      }
      'md-elevated-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        disabled?: boolean
        type?: 'button' | 'submit' | 'reset'
      }
      'md-filled-tonal-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        disabled?: boolean
        type?: 'button' | 'submit' | 'reset'
      }
      'md-text-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        disabled?: boolean
        type?: 'button' | 'submit' | 'reset'
      }
      'md-fab': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        variant?: 'surface' | 'primary' | 'secondary' | 'tertiary'
        size?: 'medium' | 'small' | 'large'
        label?: string
        lowered?: boolean
      }
      'md-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        disabled?: boolean
        selected?: boolean
        toggle?: boolean
      }
      'md-linear-progress': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        value?: number
        buffer?: number
        indeterminate?: boolean
        fourColor?: boolean
      }
      'md-circular-progress': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        value?: number
        indeterminate?: boolean
        fourColor?: boolean
      }
      'md-dialog': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        open?: boolean
        type?: 'alert' | 'confirm'
        onClose?: (e: Event) => void
        onClosed?: (e: Event) => void
        onOpened?: (e: Event) => void
      }
      'md-switch': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        selected?: boolean
        disabled?: boolean
        icons?: boolean
        showOnlySelectedIcon?: boolean
      }
      'md-tabs': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        activeTabIndex?: number
        autoActivate?: boolean
      }
      'md-primary-tab': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        active?: boolean
      }
      'md-secondary-tab': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        active?: boolean
      }
      'md-ripple': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        disabled?: boolean
      }
      'md-checkbox': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        checked?: boolean
        indeterminate?: boolean
        disabled?: boolean
      }
      'md-outlined-text-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        label?: string
        value?: string
        type?: string
        placeholder?: string
        disabled?: boolean
        error?: boolean
        errorText?: string
      }
    }
  }
}

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'md-filled-button': any
      'md-outlined-button': any
      'md-elevated-button': any
      'md-filled-tonal-button': any
      'md-text-button': any
      'md-fab': any
      'md-icon-button': any
      'md-linear-progress': any
      'md-circular-progress': any
      'md-dialog': any
      'md-switch': any
      'md-tabs': any
      'md-primary-tab': any
      'md-secondary-tab': any
      'md-ripple': any
      'md-checkbox': any
      'md-outlined-text-field': any
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'md-filled-button': any
      'md-outlined-button': any
      'md-elevated-button': any
      'md-filled-tonal-button': any
      'md-text-button': any
      'md-fab': any
      'md-icon-button': any
      'md-linear-progress': any
      'md-circular-progress': any
      'md-dialog': any
      'md-switch': any
      'md-tabs': any
      'md-primary-tab': any
      'md-secondary-tab': any
      'md-ripple': any
      'md-checkbox': any
      'md-outlined-text-field': any
    }
  }
}
