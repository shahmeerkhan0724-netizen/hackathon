import { BrowserRouter, Route, Routes } from 'react-router';
import Home from '../pages/Home';



function route() {
  return (
        <BrowserRouter>
       <Routes>
        <Route path='/' element={<Home />} />
       </Routes>
       </BrowserRouter>
  )
}

export default route