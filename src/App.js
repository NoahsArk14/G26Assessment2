import React from 'react';
import './App.css';
import Amplify, { Storage }from 'aws-amplify';
import {AmplifyAuthenticator, AmplifySignUp, AmplifySignOut} from '@aws-amplify/ui-react';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import awsconfig from './aws-exports';

Amplify.configure(awsconfig);

class ImageUpload extends React.Component {
    constructor(props) {
        super(props);
        this.state = {file: '',imagePreviewUrl: '',status: ''};

    }
    _handleSubmit(e) {
        e.preventDefault();
        this.setState({status: 'Uploaded'});
        // TODO: do something with -> this.state.file
        Storage.put(`${Date.now()}.jpeg`, this.state.file, {
            level: 'private',
            contentType: 'image/jpeg'
        });
        console.log('handle uploading-', this.state.file);
    }

    _handleImageChange(e) {
        e.preventDefault();
        this.setState({status: ''});
        let reader = new FileReader();
        let file = e.target.files[0];

        reader.onloadend = () => {
            this.setState({
                file: file,
                imagePreviewUrl: reader.result
            });
        }

        reader.readAsDataURL(file)
    }

    render() {
        let {imagePreviewUrl} = this.state;
        let $imagePreview = null;
        if (imagePreviewUrl) {
            $imagePreview = (< img className="img" src={imagePreviewUrl} />);
        } else {
            $imagePreview = (<div className="previewText">Please select an Image for Preview</div>);
        }

        return (
            <div className="previewComponent">
                <form onSubmit={(e)=>this._handleSubmit(e)}>
                <input className="fileInput" type="file" onChange={(e)=>this._handleImageChange(e)} />
                <button className="submitButton" type="submit" onClick={(e)=>this._handleSubmit(e)}>Upload</button>
                <div>{this.state.status}</div>
                </form>

                <div className="imgPreview">
                    {$imagePreview}
                </div>

            </div>


        )
    }
}

class Url extends React.Component {
  constructor(props) {
    super(props);
    this.state = { items: [], text: '' };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  render() {
    return (
      <div className="url">
        <form onSubmit={this.handleSubmit}>
          <input
            className='urlInput'
            id="url"
            placeholder="Input image url"
            onChange={this.handleChange}
            value={this.state.text}
          />
          <button>
            Select
          </button>
          <button>
            Delete
          </button>
        </form>
      </div>
    );
  }

  handleChange(e) {
    this.setState({ text: e.target.value });
  }

  handleSubmit(e) {
    e.preventDefault();
    if (this.state.text.length === 0) {
      return;
    }
    const newItem = {
      text: this.state.text,
      id: Date.now()
    };
    this.setState(state => ({
      items: state.items.concat(newItem),
      text: ''
    }));
  }
}

class AddTag extends React.Component {
  constructor(props) {
    super(props);
    this.state = { items: [], text: '' };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  render() {
    return (
      <div>

        <form onSubmit={this.handleSubmit}>
          <input
            className="tagInput"
            id="new-tag"
            placeholder="What tag needs to be added?"
            onChange={this.handleChange}
            value={this.state.text}
          />
          <button className="addbutton">
            Add
          </button>
        </form>
        <TagList items={this.state.items} />
      </div>
    );
  }

  handleChange(e) {
    this.setState({ text: e.target.value });
  }

  handleSubmit(e) {
    e.preventDefault();
    if (this.state.text.length === 0) {
      return;
    }
    const newItem = {
      text: this.state.text,
      id: Date.now()
    };
    this.setState(state => ({
      items: state.items.concat(newItem),
      text: ''
    }));
  }
}

class TagList extends React.Component {
  render() {
    return (
      <ul>
        {this.props.items.map(item => (
          <li
            className="addlist"
            key={item.id}>{item.text}</li>
        ))}
      </ul>
    );
  }
}

class SearchBox extends React.Component {
    constructor(props) {
    super(props);
    this.state = { items: [], text: '' };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  render() {
    return (
      <div className="SearchBox">
        <form onSubmit={this.handleSubmit}>
          <input
            id="searchTag"
            placeholder="search tag"
            onChange={this.handleChange}
            value={this.state.text}
          />
          <button>
               Search
          </button>
        </form>
      </div>
    );
  }

  handleChange(e) {
    this.setState({ text: e.target.value });
  }

  handleSubmit(e) {
    e.preventDefault();
    if (this.state.text.length === 0) {
      return;
    }
    const newItem = {
      text: this.state.text,
      id: Date.now()
    };
    this.setState(state => ({
      items: state.items.concat(newItem),
      text: ''
    }));
  }
}


const AuthStateApp  = () => {
    const [authState, setAuthState] = React.useState();
    const [user, setUser] = React.useState();

    React.useEffect(() => {
        return onAuthUIStateChange((nextAuthState, authData) => {
            setAuthState(nextAuthState);
            setUser(authData)
        });
    }, []);

  return authState === AuthState.SignedIn && user ? (
    <div className="App">
      <header className="App-header">
        <div className="Welcome">Hello, Explorer</div>
        <SearchBox/ >
        <ImageUpload/>
        <Url/>
        <AddTag />


        <AmplifySignOut />
      </header>
    </div>
  ) : (
          <AmplifyAuthenticator>
      <AmplifySignUp
        slot="sign-up"
        formFields={[
          { type: "username" },
          { type: "password" },
          { type: "given_name",
            lable: "Given Name *",
            placeholder: "Enter your given name",
            required: true,
          },
          { type: "family_name",
            lable: "Family Name *",
            placeholder: "Enter your family name",
            required: true,
          }
        ]}
      />
    </AmplifyAuthenticator>
  );


}


export default AuthStateApp;
