import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import { compose, graphql } from 'react-apollo';
import ListRecipes from './queries/ListRecipes';
import CreateRecipe from './mutations/CreateRecipe';
import NewRecipeSubscription from './subscriptions/NewRecipeSubscription';
import uuidV4 from 'uuid/v4';

class App extends Component {
  state = {
    name: '',
    ingredient: '',
    direction: '',
    ingredients: [],
    directions: [],
  }

  componentDidMount(){
    this.props.subscribeToNewRecipes();
  }

  onChange = (key, value) => {
    this.setState({
      [key]: value
    });
  }

  addIngredient = () => {
    //so we dont add empty items to our array :)
    if (this.state.ingredient === '') return

    const ingredients = this.state.ingredients;
    ingredients.push(this.state.ingredient);
    this.setState({
      ingredient: ''
    });
  }

  addDirection = () => {
    //so we dont add empty items to our array :)
    if (this.state.direction === '') return

    const directions = this.state.directions;
    directions.push(this.state.direction);
    this.setState({
      direction: ''
    });
  }

  addRecipe = () => {
    const { name, ingredients, directions } = this.state;
    this.props.onAdd({
      name,
      ingredients,
      directions,
      id: uuidV4()
    });

    //clear out the forms
    this.setState({
      name: '',
      ingredient: '',
      direction: '',
      ingredients: [],
      directions: []
    })
  }

  render() {
    console.log('props: ', this.props);
    return (
      <div className="App" style={styles.container}>
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        {
          this.props.recipes.map( (recipe, index) => {
            return (
              <div key={index}>
                <p>{recipe.name}</p>
              </div>
            )
          })
        }

        <input 
          value={this.state.name}
          placeholder='Recipe Name'
          style={styles.input}
          onChange={evt => this.onChange('name', evt.target.value)}
        />

        <input 
          value={this.state.ingredient}
          placeholder='Ingredient Name'
          style={styles.input}
          onChange={evt => this.onChange('ingredient', evt.target.value)}
        />
        <button onClick={this.addIngredient} style={styles.button}>Add Ingredient</button>

        <input 
          value={this.state.direction}
          placeholder='Direction Name'
          style={styles.input}
          onChange={evt => this.onChange('direction', evt.target.value)}
        />
        <button onClick={this.addDirection} style={styles.button}>Add Direction</button>

        <button onClick={this.addRecipe} style={styles.button}>Add Recipe</button>
      </div>
    );
  }
}


const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  input: {
    fontSize: 22,
    height: 50,
    width: 450,
    border: 'none',
    borderBottom: '2px solid blue',
    margin: 10,
  },
  button: {
    height: 50,
    margin: 10,
    width: 450
  }
}

export default compose(

  graphql(ListRecipes, 
    {
      options: {
        //when app loads, fetch data from cache then when query is done, load that
        fetchPolicy: 'cache-and-network'
      },
      //function that takes props (that is returned from gql call) as an argument
      //returns an object. Any property on this object will be attached to this.props of the component
      props: props => ({
        recipes: props.data.listRecipes ? props.data.listRecipes.items : [],
        //crate new function that takes in params variable
        //subscribeToMore is from GraphqlQueryControls library
        subscribeToNewRecipes: params => {
          props.data.subscribeToMore({
            document: NewRecipeSubscription,
            //update query with previous data and data from onCreateRecipe subscription
            updateQuery: (prev, { subscriptionData: { data: {onCreateRecipe}}}) => {
              return({
                ...prev,
                listRecipes: {
                  __typename: 'RecipeConnection',
                  items: [onCreateRecipe, ...prev.listRecipes.items.filter(recipe => recipe.id !== onCreateRecipe.id)]
                }
              })
            }
          })
        }
      })
    }
  ),

  graphql(CreateRecipe,
    {
      props: props => ({
        onAdd: recipe => {
          //console.log(recipe);
          props.mutate({
            variables: recipe,
            optimisticResponse: {
              __typename: 'Mutation',
              //creating new variable that can be used later
              //takes in recipe object and typename
              createRecipe: {...recipe, __typename: 'Recipe'}
            },
            //updates local cache, 
            //we are optimistic about the mutation to work
            //so we are just going to update and if it messes up later we can pull it out
            update: (proxy, { data: { createRecipe} }) => {
              //this is going to give us current data
              const data = proxy.readQuery({ query: ListRecipes });

              //there is a bug that it addes twice. resolved already but for safety
              let hasBeenAdded = false;
              data.listRecipes.items.map((item)=>{
                if(item.id === createRecipe.id){
                  hasBeenAdded = true;
                }
              });
              if (hasBeenAdded) return

              data.listRecipes.items.push(createRecipe);
              proxy.writeQuery({ query:ListRecipes, data })
            }
          });         
        }
      })
    }
  )

)(App);
