function SectionTitle({
  eyebrow,
  title,
  description,
  align = 'left',
  className = '',
  as: Heading = 'h2',
  ...props
}) {
  const alignment = {
    center: 'items-center text-center mx-auto',
    right: 'items-end text-right',
    left: 'items-start text-left',
  }[align]

  return (
    <div
      className={`flex max-w-3xl flex-col gap-2 ${alignment} ${className}`}
      {...props}
    >
      {eyebrow && (
        <span className="qc-section-eyebrow">
          {eyebrow}
        </span>
      )}
      {title && (
        <Heading className="qc-section-heading">
          {title}
        </Heading>
      )}
      {description && (
        <p className="qc-section-description">
          {description}
        </p>
      )}
    </div>
  )
}

export default SectionTitle
