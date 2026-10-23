import Icon from './Icon'

// Section heading with an icon in a navy tile — used on every dashboard panel so they all match
export default function PanelTitle({ icon, children, className = 'mt-0 mb-2' }) {
  return (
    <h4 className={`${className} flex items-center gap-2 font-bold text-brand-navy`}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-navy text-brand-cyan">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      {children}
    </h4>
  )
}
