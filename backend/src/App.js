import Signup from './components/Signup';

import Navbar from './components/Navbar';
import Menu from './components/Menu';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { closeSignin } from './actions/signinActions';

const App = () => {
    const dispatch = useDispatch();
    const [menuOpen, setMenuOpen] = useState(true);

    useEffect(() => {
        const resize = () => {
            if (window.innerWidth < 1100) {
                setMenuOpen(false);
            } else {
                setMenuOpen(true);
            }
        }
        resize();
        window.addEventListener("resize", resize);
        dispatch(closeSignin());
        return () => window.removeEventListener("resize", resize);
    }, [dispatch]);

    return (
        <div>
            {/* Rest of the component content */}
        </div>
    );
};

export default App; 