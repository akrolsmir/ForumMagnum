import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import { reCaptchaSiteKeySetting } from '../../lib/publicSettings';
import { commentBodyStyles } from '../../themes/stylePiping';
import { gql, useMutation } from '@apollo/client';


const styles = theme => ({
  root: {
    ...commentBodyStyles(theme),
    padding: 16,
    marginTop: 0,
    marginBottom: 0,
    width: 252
  }, 
  input: {
    font: 'inherit',
    color: 'inherit',
    display: 'block',
    fontSize: '1.2rem',
    marginBottom: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    width: '100%'
  },
  submit: {
    font: 'inherit',
    color: 'inherit',
    display: 'block',
    textTransform: 'uppercase',
    width: '100%',
    height: 32,
    marginTop: 16,
    cursor: 'pointer',
    fontSize: '1rem'
  }, 
  error: {
    padding: 8,
    color: theme.palette.error.main 
  },
  options: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1rem',
    marginTop: 4,
    padding: 4
  },
  oAuthBlock: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  oAuthComment: {
    textAlign: 'center',
    fontSize: '0.8em',
    margin: 10
  },
  oAuthLink: {
    color: 'rgba(0,0,0,0.7) !important',
    fontSize: '0.9em',
    padding: 6
  },
  toggleState: {
    cursor: 'pointer',
    '&:hover': {
      color: 'rgba(0,0,0,0.5)'
    }
  },
  resetPassword: {
    cursor: 'pointer',
    '&:hover': {
      color: 'rgba(0,0,0,0.5)'
    }
  }
})

const loginMutation = gql`
  mutation login($username: String, $password: String) {
    login(username: $username, password: $password) {
      token
    }
  }
`

const signupMutation = gql`
  mutation signup($email: String, $username: String, $password: String, $subscribeToCurated: Boolean) {
    signup(email: $email, username: $username, password: $password, subscribeToCurated: $subscribeToCurated) {
      token
    }
  }
`


const WrappedLoginForm = ({ onSignedInHook, onPostSignUpHook, formState, classes }: {
  onSignedInHook?: any,
  onPostSignUpHook?: any,
  formState?: any,
  classes: ClassesType
}) => {
  const { SignupSubscribeToCurated } = Components;
  const [reCaptchaToken, setReCaptchaToken] = useState<any>(null);
  const [username, setUsername] = useState<string | undefined>(undefined)
  const [password, setPassword] = useState<string | undefined>(undefined)
  const [email, setEmail] = useState<string | undefined>(undefined)
  const [signup, setSignup] = useState<boolean>(false)
  const [subscribeToCurated, setSubscribeToCurated] = useState<boolean>(true)
  const [ mutate, { error } ] = useMutation(signup ? signupMutation : loginMutation, { errorPolicy: 'all' })
  const submitFunction = signup ? 
    async () => {
      const { data } = await mutate({ variables: { email, username, password, subscribeToCurated }})
      if (data?.signup?.token) {
        location.reload()
      }
    } :
    async () => {
      const { data } = await mutate({ variables: { username, password }})
      if (data?.login?.token) {
        // If login is successful, just refresh the page
        location.reload()
      }
    }
  // const clientId = useClientId();

  // const customSignupFields = ['EAForum', 'AlignmentForum'].includes(forumTypeSetting.get())
  //   ? []
  //   : [
  //     {
  //       id: "subscribeToCurated",
  //       type: 'custom',
  //       defaultValue: true,
  //       renderCustom: Components.SignupSubscribeToCurated
  //     }
  //   ]

  return <React.Fragment>
    {reCaptchaSiteKeySetting.get()
      && <Components.ReCaptcha verifyCallback={(token) => setReCaptchaToken(token)} action="login/signup"/>}
    <div className={classes.root}>
      {signup && <input value={email} type="text" name="email" placeholder="email" className={classes.input} onChange={event => setEmail(event.target.value)} />}
      <input value={username} type="text" name="username" placeholder={signup ? "username" : "username or email"} className={classes.input} onChange={event => setUsername(event.target.value)}/>
      <input value={password} type="password" name="password" placeholder="password" className={classes.input} onChange={event => setPassword(event.target.value)}/>
      <button className={classes.submit} onClick={submitFunction}>
        {signup ? "Sign Up" : "Log In"}
      </button>
      {signup && <SignupSubscribeToCurated defaultValue={true} onChange={(e) => setSubscribeToCurated(e.target.value)} />}
      <div className={classes.options}>
        <span className={classes.toggleState} onClick={() => setSignup(!signup)}> {signup ? "Log In" : "Sign Up"} </span>
        <span className={classes.resetPassword}> Reset Password </span>
      </div>
      <div className={classes.oAuthComment}>...or continue with</div>
      <div className={classes.oAuthBlock}>
        <a className={classes.oAuthLink} href="/auth/facebook">FACEBOOK</a>
        <a className={classes.oAuthLink} href="/auth/google">GOOGLE</a>
        <a className={classes.oAuthLink} href="/auth/github">GITHUB</a>
      </div>
      {/* <a href="/auth/facebook"><FacebookIcon /></a>
      <a href="/auth/github"><GithubIcon /></a> */}
      {error && <div className={classes.error}>{error.message}</div>}
    </div>
  </React.Fragment>;
}

const WrappedLoginFormComponent = registerComponent('WrappedLoginForm', WrappedLoginForm, { styles });

declare global {
  interface ComponentTypes {
    WrappedLoginForm: typeof WrappedLoginFormComponent
  }
}
