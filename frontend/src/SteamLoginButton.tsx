import styled from "styled-components";

const StyledButton = styled.button`
  background-color: #1b2838;
  color: white;
  font-size: 1rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #171a21;
    transform: scale(1.05);
  }

  &:active {
    background-color: #0b0d0f;
    transform: scale(0.95);
  }
`;

const SteamLoginButton = () => {
  const redirectToSteamAuth = () => {
    const authUrl = `http://localhost:5000/auth/steam`;
    window.location.href = authUrl;
  };

  return (
    <StyledButton onClick={redirectToSteamAuth}>
      Conectar com a Steam
    </StyledButton>
  );
};

export default SteamLoginButton;
