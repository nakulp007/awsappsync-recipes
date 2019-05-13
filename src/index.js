import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

import Client from 'aws-appsync';
import { Rehydrated } from 'aws-appsync-react'
import { ApolloProvider as Provider } from 'react-apollo'

import config from './appsync'

const client = new Client({
    url: config.graphqlEndpoint,
    region: config.region,
    auth: {
        type: config.authenticationType,
        apiKey: config.apiKey
    }
});

//appsync is something that works offline
//and the way it does that is it works with 
//your local storage on web or AsyncStorage on React Native
//When you restart the app, it is going to look and use the local data
//before it goes and fetches new data
//So Rehydrated will wait to render the application until our data is ready
//that way we dont have any errors or anything like that
const WithProvider = () => {
    return(
        <Provider client={client}>
            <Rehydrated>
                <App />
            </Rehydrated>
        </Provider>
    )
}

//instead of returning the app we will return this WithProvider component
ReactDOM.render(<WithProvider />, document.getElementById('root'));
