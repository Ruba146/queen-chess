function PageContainer({
  children,
  className = '',
  maxWidth = 'max-w-[1440px]',
  as: Component = 'div',
  ...props
}) {
  const classes = [
    'mx-auto w-full px-5 py-4 sm:px-8 sm:py-5 lg:px-10',
    maxWidth,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  )
}

export default PageContainer
