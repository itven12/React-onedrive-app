import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
export default function LoginPage({ account, setAccount }) {
  const { instance } = useMsal();
  const navigate = useNavigate();

  if (account) {
    navigate("/home");
  }

  function handleLogin() {
    instance
      .loginPopup({
        scopes: ["User.Read", "Files.Read.All"],
      })
      .then((res) => {
        console.log(res);
        const user = {
          name: res.account.name,
          username: res.account.username,
          accessToken: res.accessToken,
        };
        setAccount(user);
        navigate("/home");
      })
      .catch((err) => console.log(err));
  }
  return (
    <>
      <button className="login-button" onClick={handleLogin}>
        Login with Microsoft
      </button>
    </>
  );
}
