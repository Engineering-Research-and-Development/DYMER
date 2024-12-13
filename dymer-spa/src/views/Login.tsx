import React, { useCallback, useState } from "react";
//import Footer from "components/Footer/Footer.tsx";
import { Card, CardBody, CardTitle, Form, FormGroup, Input, Label, Button } from "reactstrap";

import logo from "../assets/img/Dymer_logo.png";
import { client } from "../api/axios";


function Login() {
  const [user, setUser] = useState({
    username: '',
    password: ''
  })
  const [validCredentials, setValidCredentials] = useState(false)

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  }, []);


  const handleSubmit = async () => {
    // e.preventDefault();

    try {
      const token = await client.post("http://localhost:8080/api/portalweb/authenticate", user)

      localStorage.setItem("DYM", token.data['DYM'])
      localStorage.setItem('DYMisi', token.data["DYMisi"]);
      localStorage.setItem('d_rl', token.data["d_rl"]);
      localStorage.setItem('d_lp', token.data["d_lp"]);
      document.cookie = "lll=" + token.data["DYM"];
      document.cookie = "DYMisi=" + token.data["DYMisi"];
      localStorage.setItem('d_uid', token.data.d_uid);
      localStorage.setItem('d_appuid', token.data.d_appuid);
      localStorage.setItem('d_gid', token.data.d_gid);

      console.log(token.data)

    } catch (e) {
      setValidCredentials(true)
      console.log("Invalid Credetials")
    }

  };

  return (
    <>
      <div className="login-background">
        <Card className="text-center p-5">
          <img src={logo} alt="dymer-logo" />
          <CardBody>
            <CardTitle tag="h5">
              Sign in
            </CardTitle>
            <div>
              <Form>
                <FormGroup floating>
                  <Input
                    id="Username"
                    name="username"
                    placeholder="username"
                    type="text"
                    value={user.username}
                    onChange={handleInputChange}
                  />
                  <Label for="username">
                    Username
                  </Label>
                </FormGroup>
                <FormGroup floating>
                  <Input
                    id="Password"
                    name="password"
                    placeholder="password"
                    type="password"
                    value={user.password}
                    onChange={handleInputChange}
                  />
                  <Label for="password">
                    Password
                  </Label>
                </FormGroup>
                {validCredentials && <div> Invalid credentials </div>}
                <div>
                  <Button className="btn-login" type="submit" onClick={handleSubmit}>
                    Login
                  </Button>
                </div>
              </Form>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* <Footer fluid /> */}
    </>
  );
}

export default Login;