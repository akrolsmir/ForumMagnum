import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Checkbox from '@material-ui/core/Checkbox';

class SignupSubscribeToCurated extends Component
{
  state = {
    checked: this.props.defaultValue
  }
  render() {
    const {onChange, id} = this.props;
    return <div key={id}>
      <Checkbox
        checked={this.state.checked}
        onChange={(ev, checked) => {
          this.setState({
            checked: checked
          });
          onChange({target: {value: checked}})
        }}
      />
      Subscribe to curated posts
    </div>
  }
}

class WrappedLoginForm extends Component
{
  state = {
    reCaptchaToken: null
  };
  
  setReCaptchaToken = (token) => {
    this.setState({reCaptchaToken: token})
  }
  
  render() {
    const customSignupFields = [
      {
        id: "subscribeToCurated",
        type: 'custom',
        defaultValue: true,
        renderCustom: SignupSubscribeToCurated
      }
    ]
    
    return <React.Fragment>
      {getSetting('reCaptcha.apiKey')
        && <Components.ReCaptcha verifyCallback={this.setReCaptchaToken} action="login/signup"/>}
      <Components.AccountsLoginForm
        onPreSignUpHook={(options) => {
          const reCaptchaToken = this.state.reCaptchaToken
          return {...options, profile: {...options.profile, reCaptchaToken}}
        }}
        customSignupFields={customSignupFields}
      />
    </React.Fragment>;
  }
}

registerComponent('WrappedLoginForm', WrappedLoginForm);
