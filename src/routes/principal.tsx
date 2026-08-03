import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/principal')({
  component: PrincipalLayout,
})

function PrincipalLayout() {
  return <Outlet />
}
