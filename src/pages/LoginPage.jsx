import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
export default function LoginPage({ account, setAccount, session }) {
  const { instance } = useMsal();
  const navigate = useNavigate();

  if (session.isLoggedIn()) {
    setAccount(JSON.parse(localStorage.getItem("account")));
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
        localStorage.setItem("account", JSON.stringify(user));
        localStorage.setItem("accessToken", JSON.stringify(user.accessToken));
        const expiresOn = res.expiresOn.getTime();
        console.log(new Date(expiresOn));
        localStorage.setItem(
          "expiresAt",
          JSON.stringify(res.expiresOn.getTime())
        );
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
