import React from 'react';
import fetch from 'node-fetch';
import './App.css';
import Amplify, { Storage, API }from 'aws-amplify';
//import {API} from 'aws-amplify';
import {AmplifyAuthenticator, AmplifySignUp, AmplifySignOut} from '@aws-amplify/ui-react';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import awsconfig from './aws-exports';


Amplify.configure(awsconfig);
const apiName = "api1";

class ImageUpload extends React.Component {
    constructor(props) {
        super(props);
        this.state = {file: '',imagePreviewUrl: '',status: '',resultUrl: ''};
    }


    _handleSubmit(e) {
        e.preventDefault();
        this.setState({status: 'Uploaded'});

        Storage.put(`${Date.now()}.jpeg`, this.state.file, {
            bucket: "amplifywebappebbe4e606317487fb5d53ef1745dcc2f35517-dev",
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
    
//3.2
    searchImage(e) {
        e.preventDefault();
        // TODO: change apiName,path,myInit (maybe response)
        var path = "/items2";
        const myInit = {
          body: {"image": this.state.file},
          headers: {'Content-Type': 'application/json'}
        };
        API.put(apiName, path, myInit).then(response => {
            this.setState({resultUrl: response.status})
        })
      .catch(error => {
        console.log(error.response);
        });
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
                <button onClick={(e)=>this.searchImage(e)}>SearchImage</button>
                <div>{this.state.status}</div> 
                <div>{this.state.resultUrl}</div>
                </form>
                <div className="imgPreview">
                    {$imagePreview}
                </div>

            </div>


        )
    }
}

class SearchBox extends React.Component {
    constructor(props) {
    super(props);
    this.state = { items: [], text: '' ,Url: []};
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
        <div> {this.state.Url} </div>
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
    };
    var tags = [];
    tags = this.state.text.split(" ");
    // const newItem = {
    //   text: this.state.text,
    //   id: Date.now()
    // };
    // this.setState(state => ({
    //   items: state.items.concat(newItem),
    //   text: ''
    // }));
    // TODO: change apiName,path,myInit (maybe response)
    var path = "/items"
    const myInit = {
      body: {"tags": tags},
      headers: {"Content-Type": "application/json"}
    };
    API.post(apiName, path, myInit).then(response => {
      console.log(response)
    })
  .catch(error => {
    console.log(error.response);
    });
  }

}

class Url extends React.Component {
  constructor(props) {
    super(props);
    this.state = { items: [], text: '', Url: '' ,tag: '', status: ''};
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  render() {
    return (

        <div className="url">
            <form onSubmit={this.handleSubmit}>
              <input
                className='urlInput'
                placeholder="Input image url"
                onChange={this.handleChange}
                value={this.state.text}
              />
              <button>
                Select
              </button>
              <button onClick={(e)=>this.deleteImage(e)}>
                Delete
              </button>
             </form>
            <div> {this.state.Url} </div>
            <div> {this.state.status} </div>
            <AddTag Url={this.state.Url} />
        </div>

    );
  }

  deleteImage(e) {
    e.preventDefault();
    // TODO: change apiName,path,myInit (maybe response)
    var path = "/items4";
    const myInit = {
      body: {"url": this.state.Url},
      headers: {'Content-Type': 'application/json'}
    };
    API.del(apiName, path, myInit).then(response => {
        this.setState({status: response.status})
    })
  .catch(error => {
    console.log(error.response);
    });
  }

  handleChange(e,type) {
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

    this.setState({Url: this.state.text});
  }
}

class AddTag extends React.Component {
  constructor(props) {
    super(props);
    this.state = { items: [], text: '', tag: '', Url: ''};
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
        <div> {this.state.Url} </div>
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
    this.setState({Url: this.props.Url});
    this.setState({tag: this.state.text});
    const newItem = {
      text: this.state.text,
      id: Date.now()
    };
    this.setState(state => ({
      items: state.items.concat(newItem),
      text: ''
    }));
    // TODO: change apiName,path,myInit (maybe response)
    var tags = [];
    tags = this.state.text.split(" ");
    var path = "/items3";
    const myInit = {
      body: {"url": this.state.Url, "tags": tags},
      headers: {'Content-Type': 'application/json'}
    }
    API.put(apiName, path, myInit).then(response => {
        this.setState({status: response.status})
    })
  .catch(error => {
    console.log(error.response);
    });
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

        <ImageUpload/>
        <SearchBox/>
        <Url/>
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
