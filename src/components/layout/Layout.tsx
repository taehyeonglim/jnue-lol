import { Outlet } from 'react-router-dom'
import { Content } from '@carbon/react'
import Header from './Header'
import Footer from './Footer'
import OnlineUsers from '../common/OnlineUsers'

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Content style={{ flex: 1, padding: 0 }}>
        <Outlet />
      </Content>
      <Footer />
      <OnlineUsers />
    </div>
  )
}
