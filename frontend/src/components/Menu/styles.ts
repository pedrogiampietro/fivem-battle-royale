import styled from 'styled-components';

export const MenuContainer = styled.div`
	background: rgba(27, 30, 34, 0.98);
	backdrop-filter: blur(5px);
	border-radius: 5px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 20px 0px;
	width: 60px;
	height: 292px;
	position: fixed;
	top: 70px;
	left: 10%;
	gap: 1.4375rem;
	z-index: 500;
`;

export const MenuItem = styled.a`
	width: 2rem;
	height: 2rem;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgb(37, 41, 45);
	color: rgb(54, 59, 65);
	transition: all 0.4s ease 0s;
	border: none;
	cursor: pointer;
	position: relative;
	border-radius: 5px;
	text-decoration: none;

	&:hover {
		color: rgb(123, 47, 253);

		&::after {
			content: attr(href);
			position: absolute;
			left: 40px;
			background-color: white;
			padding: 10px;
			border-radius: 5px;
		}
	}

	&.is-current {
		color: rgb(250, 250, 250);
		background: linear-gradient(
			91.48deg,
			rgb(123, 47, 253) 0%,
			rgb(79, 18, 184) 100%
		);
	}

	svg {
		width: 15px;
		height: 15px;
	}
`;

export const AvatarCardContainer = styled.div`
	background: rgba(27, 30, 34, 0.98);
	backdrop-filter: blur(5px);
	border-radius: 5px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 20px 0px;
	width: 200px;
	height: 250px;
	position: fixed;
	top: 70px;
	right: 10%;
	gap: 1rem;
	z-index: 500;

	& p {
		font-size: 9px;
	}
`;

export const AvatarImage = styled.img`
	width: 100px;
	height: 100px;
	border-radius: 50%;
`;

export const AvatarName = styled.span`
	color: white;
	font-size: 1rem;
`;

export const LogoutIconContainer = styled.div`
	width: 1.875rem;
	height: 1.875rem;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
`;

export const LogoutButton = styled.button`
	width: 30px;
	background: transparent;
	color: white;
	border: none;
	cursor: pointer;
	font-size: 0.875rem;
	text-decoration: underline;
	position: relative;
	overflow: hidden;
	border-radius: 5px;

	&::before {
		content: '';
		position: absolute;
		top: -5px;
		left: -5px;
		right: -5px;
		bottom: -5px;
		background-color: rgba(0, 0, 0, 0.3);
		border-radius: 5px;
		z-index: -1;
	}

	&:hover {
		color: rgb(123, 47, 253);
		&::before {
			background-color: rgba(0, 0, 0, 0.6); /* Darker background on hover */
		}

		${LogoutIconContainer} {
			/* Apply the brightness effect on hover */
			filter: brightness(1.2); /* Adjust the brightness value as needed */
		}
	}
`;
