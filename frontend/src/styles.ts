import styled from 'styled-components';

interface BannerProps {
	background: string;
}

export const CenteredContainer = styled.div`
	width: 100%;
	max-width: 76.25rem;
	margin: -50px auto 30px;
	z-index: 2;
	position: relative;
	padding: 0px 1rem;
	display: flex;
	flex-direction: column;
`;

export const Banner = styled.div<BannerProps>`
	width: 100%;
	height: 53.3125rem;
	position: relative;
	background: linear-gradient(360deg, rgb(24, 24, 27) 5%, rgba(0, 0, 0, 0) 100%)
			0% 0% / cover,
		url(${(props) => props.background}) center center no-repeat;
`;
