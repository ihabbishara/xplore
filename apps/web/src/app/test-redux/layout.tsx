import { ProvidersTest } from '../providers-test'

export default function TestReduxLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ProvidersTest>{children}</ProvidersTest>
      </body>
    </html>
  )
}