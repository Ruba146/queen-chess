import SectionTitle from '../ui/SectionTitle'

function PageHeader({ eyebrow, title, description, ...props }) {
  return (
    <div className="mb-4">
      <SectionTitle
        eyebrow={eyebrow}
        title={title}
        description={description}
        {...props}
      />
    </div>
  )
}

export default PageHeader
