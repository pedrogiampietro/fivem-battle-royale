import styled, { css } from 'styled-components';
import { FiSearch } from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';

export interface StatusButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	$playerReady: boolean;
}
interface CollapseWrapperProps {
	$isOpen: boolean;
}

export const GroupSection = styled.section`
	position: relative;
	background: rgb(39, 39, 42);
	border-top: 1px solid rgb(120, 45, 248);
	border-radius: 5px;
	padding: 0.9375rem 1.875rem 1.5625rem;
	margin-top: 33px;
	margin-bottom: 64px;
`;

export const InnerGroupSection = styled.section`
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 2rem;
	margin-top: 1rem;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(3, 1fr);
	}

	@media (max-width: 768px) {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
	}
`;

export const PlayerBox = styled.div`
	background: linear-gradient(
		274.68deg,
		rgba(123, 47, 253, 0.25) 5.83%,
		rgb(89, 41, 172) 72.5%,
		rgb(123, 47, 253) 98.7%
	);
	border-radius: 0.625rem;
	height: 3.875rem;
	width: 16.125rem;
	padding: 1rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	position: relative;
`;

export const Avatar = styled.img`
	width: 30px;
	height: 30px;
	border-radius: 50%;
	margin-right: 0.75rem;
`;

export const CrownIcon = styled(FaCrown)`
	color: #ffd700;
	margin-left: 5px;
`;

export const AddPlayerBox = styled(PlayerBox)`
	background: rgba(54, 54, 59, 0.25);
	justify-content: center;
	cursor: pointer;
`;

export const StatusButton = styled.button<StatusButtonProps>`
	background: ${(props) =>
		props.$playerReady ? 'rgb(0, 255, 0)' : 'rgb(113, 113, 122)'};
	color: rgb(255, 255, 255);
	border-radius: 5px;
	display: flex;
	align-items: center;
	gap: 4px;
	border: none;
	font-size: 0.75rem;
	padding: 2px 6px;
	transition: all 0.4s ease 0s;

	&:hover {
		background: rgb(0, 255, 0);
		cursor: pointer;
	}
`;

export const InviteIcon = styled.div`
	/* Replace this with the actual SVG for your plus icon */
`;

export const CardContainer = styled.div`
	display: grid;
	grid-template-rows: auto auto;
	gap: 0.5rem;
`;

export const CollapseWrapper = styled.div<CollapseWrapperProps>`
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 1rem;
	gap: 10px;
	grid-column: 1 / -1;
	overflow: hidden;
	transition: height 0.3s ease-in-out;
	width: 280px;
	height: 160px;
	background-color: rgba(27, 30, 34, 0.98);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 10px;
	box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
	${(props) =>
		props.$isOpen &&
		css`
			height: auto;
		`}
`;

export const SearchPlayersContent = styled.div`
	padding: 1rem;
	border-radius: 5px;
	margin-top: 0.5rem;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: center;
	gap: 10px;
`;

export const HeaderContent = styled.header`
	font-weight: bold;
	font-size: 1.2rem;
`;

export const DescriptionText = styled.p`
	font-size: 1rem;
	color: #999;
`;

export const SearchBox = styled.div`
	width: 100%;
	height: 1.625rem;
	background: rgb(63, 63, 70);
	border: 0.5px solid rgb(113, 113, 122);
	box-shadow: rgba(4, 4, 3, 0.2) 0px 3px 5px, rgba(4, 4, 3, 0.31) 0px 0px 1px;
	border-radius: 5px;
	display: flex;
	align-items: center;
	overflow: hidden;
	margin: 1rem 0px;
`;

export const SearchInput = styled.input`
	padding: 0.5rem;
	flex-grow: 1;
	border: none;
	outline: none;
	background: transparent;
	color: rgb(250, 250, 250);
`;
export const SearchIcon = styled(FiSearch)`
	margin-right: 0.5rem;
`;

export const FriendsSection = styled.section`
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
`;

export const NoResultText = styled.p`
	font-size: 0.9rem;
	color: #777;
`;

export const Friend = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 15px;
	border: 1px solid #e0e0e0;
	border-radius: 5px;
	margin-bottom: 10px;
	background-color: #3f3f46;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background-color: #e9e9e9;
	}
`;

export const InviteButton = styled.button`
	background-color: #4caf50;
	color: #0000;
	border: none;
	border-radius: 5px;
	padding: 5px 10px;
	font-size: 0.9rem;
	cursor: pointer;
	transition: background-color 0.2s;
	margin: 0 1rem;

	&:hover {
		background-color: #45a049;
	}

	&:disabled {
		background-color: #b2dfdb;
		cursor: not-allowed;
	}
`;

export const RemoveButton = styled.button`
	background-color: #f44336; // A red shade for removal actions
	color: #ffffff; // White text color
	border: none;
	border-radius: 5px;
	padding: 5px 10px;
	font-size: 0.9rem;
	cursor: pointer;
	transition: background-color 0.2s;
	margin: 0 1rem;

	&:hover {
		background-color: #d32f2f; // Darker shade of red on hover
	}

	&:disabled {
		background-color: #ef9a9a; // Lighter shade of red for disabled state
		cursor: not-allowed;
	}
`;
