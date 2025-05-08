import { ThemeProvider } from "styled-components";
import { useState, useEffect } from "react";
import { darkTheme, lightTheme } from './utils/Themes';
import Signup from './components/Signup';
import Signin from './components/Signin';
import Navbar from './components/Navbar';
import Menu from './components/Menu';
import Dashboard from './pages/Dashboard';
import ToastMessage from './components/ToastMessage';
import Search from './pages/Search';
import Favourites from './pages/Favourites';
import Profile from './pages/Profile';
import Upload from './components/Upload';
import DisplayPodcasts from './pages/DisplayPodcasts';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import styled from 'styled-components';
import AudioPlayer from "./components/AudioPlayer";
import VideoPlayer from "./components/VideoPlayer";
import PodcastDetails from "./pages/PodcastDetails";
import { closeSignin } from "./redux/setSigninSlice";
import { RootState } from "./redux/store";

const Frame = styled.div`
  display: flex;
  flex-direction: column;
  flex: 3;
`;

const Podstream = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100vh;
  background: ${({ theme }) => theme.bgLight};
  overflow-y: hidden;
  overflow-x: hidden;
`;

function App() {
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const { open, message, severity } = useSelector((state: RootState) => state.snackbar);
    const { openplayer, type, episode, podid, currenttime, index } = useSelector((state: RootState) => state.audioplayer);
    const { opensi } = useSelector((state: RootState) => state.signin);
    const [SignUpOpen, setSignUpOpen] = useState<boolean>(false);
    const [SignInOpen, setSignInOpen] = useState<boolean>(false);
    const [menuOpen, setMenuOpen] = useState<boolean>(true);
    const [uploadOpen, setUploadOpen] = useState<boolean>(false);

    const { currentUser } = useSelector((state: RootState) => state.user);
    const dispatch = useDispatch();

    // Set the menuOpen state to false if the screen size is less than 768px
    useEffect(() => {
        const resize = () => {
            if (window.innerWidth < 1110) {
                setMenuOpen(false);
            } else {
                setMenuOpen(true);
            }
        }
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    useEffect(() => {
        dispatch(
            closeSignin()
        );
    }, [dispatch]);

    return (
        <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
            <BrowserRouter>
                {opensi && <Signin setSignInOpen={setSignInOpen} setSignUpOpen={setSignUpOpen} />}
                {SignUpOpen && <Signup setSignInOpen={setSignInOpen} setSignUpOpen={setSignUpOpen} />}
                {uploadOpen && <Upload setUploadOpen={setUploadOpen} />}
                {/* {openplayer && type === 'video' && <VideoPlayer episode={episode} podid={podid} currenttime={currenttime} index={index} />}
                {openplayer && type === 'audio' && <AudioPlayer episode={episode} podid={podid} currenttime={currenttime} index={index} />} */}
                {openplayer && <AudioPlayer episode={episode} podid={podid} currenttime={currenttime} index={index} />}
                <Podstream>
                    {menuOpen && <Menu setMenuOpen={setMenuOpen} darkMode={darkMode} setDarkMode={setDarkMode} setUploadOpen={setUploadOpen} setSignInOpen={setSignInOpen} />}
                    <Frame>
                        <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} setSignInOpen={setSignInOpen} setSignUpOpen={setSignUpOpen} />
                        <Routes>
                            <Route path='/' element={<Dashboard setSignInOpen={setSignInOpen} />} />
                            <Route path='/search' element={<Search />} />
                            <Route path='/favourites' element={<Favourites />} />
                            <Route path='/profile' element={<Profile />} />
                            <Route path='/podcast/:id' element={<PodcastDetails />} />
                            <Route path='/showpodcasts/:type' element={<DisplayPodcasts />} />
                        </Routes>
                    </Frame>
                    {open && <ToastMessage open={open} message={message} severity={severity} />}
                </Podstream>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App; 