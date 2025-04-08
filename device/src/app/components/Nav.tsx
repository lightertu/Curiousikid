import React from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpenReader } from "@fortawesome/free-solid-svg-icons";
import useDeviceState from "../DeviceState";

const Nav: React.FC = () => {
	const { libraryStatus, setLibraryStatus } = useDeviceState();
	const toggleLibraryStatus = () => {
		setLibraryStatus(!libraryStatus);
	}
	return (
		<NavContainer>
			<H1 $libraryStatus={libraryStatus}>Current Playing</H1>
			<Button onClick={toggleLibraryStatus}>
				<span>Library</span>
				<FontAwesomeIcon icon={faBookOpenReader} />
			</Button>
		</NavContainer>
	);
};

const NavContainer = styled.div`
	min-height: 10vh;
	display: flex;
	justify-content: space-around;
	align-items: center;
	@media screen and (max-width: 768px) {
		position: fixed;
		z-index: 10;
		top: 0;
		left: 0;
		width: 100%;
	}
`;

const H1 = styled.h1<{ $libraryStatus?: boolean }>`
	font-size: 2rem;
	transition: all 0.5s ease;
	color: ${props => props.$libraryStatus ? 'some-color' : 'other-color'};

	@media screen and (max-width: 768px) {
		visibility: ${(p) => (p.$libraryStatus ? "hidden" : "visible")};
		opacity: ${(p) => (p.$libraryStatus ? "0" : "100")};
		transition: all 0.5s ease;
	}
`;

const Button = styled.button`
	background: transparent;
	border: none;
	cursor: pointer;
	border: 2px solid rgb(65, 65, 65);
	padding: 0.5rem;
	transition: all 0.3s ease;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	&:hover {
		background: rgb(65, 65, 65);
		color: white;
	}
`;

export default Nav;
