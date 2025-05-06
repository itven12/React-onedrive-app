import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
export default function LoginPage({ account, setAccount }) {
  const { instance } = useMsal();
  const navigate = useNavigate();

  // if (account) {
  //   navigate("/home");
  // }

  // function handleLogin() {
  //   let user = {};
  //   instance
  //     .loginPopup({
  //       scopes: ["User.Read", "Files.Read.All"],
  //     })
  //     .then((res) => {
  //       console.log(res);
  //       user = {
  //         name: res.account.name,
  //         username: res.account.username,
  //         accessToken: res.accessToken,
  //       };
  //     })
  //     .catch((err) => console.log(err));
  //   fetch("http://localhost:3000/api/auth/login", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify(user),
  //   })
  //     .then((res) => res.json())
  //     .then((data) => {
  //       console.log(data.data, data.token);
  //       setAccount(data.data);
  //     });

  async function handleLogin() {
    const res = await instance.loginPopup({
      scopes: ["User.Read", "Files.Read.All"],
    });
    const user = {
      name: res.account.name,
      username: res.account.username,
      accessToken: res.accessToken,
    };
    // setAccount(user);
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });
    const data = await response.json();
    console.log(data);
    // localStorage.setItem("account", JSON.stringify(data.data));
    localStorage.setItem("token", data.token);
    navigate("/home");
  }

  return (
    <>
      <button className="login-button" onClick={handleLogin}>
        Login with Microsoft
      </button>
    </>
  );
}
