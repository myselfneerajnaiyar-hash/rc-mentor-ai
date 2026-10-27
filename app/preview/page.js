import PreviewLandingPage from '../preview-ad/PreviewAdLandingPage'

export default function PreviewPage({ searchParams = {} }) {
  return <PreviewLandingPage searchParams={searchParams} homeHref="/preview" />
}
