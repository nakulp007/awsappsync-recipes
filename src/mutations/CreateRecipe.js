import graphql from 'graphql-tag'

//import { gql } from 'apollo-boost';

export default graphql`
    mutation createRecipe(
        $id: ID!
        $name: String!
        $ingredients: [String]!
        $directions: [String]!
    ){
        createRecipe(input: {
            id: $id, name: $name, ingredients: $ingredients, directions: $directions
        }){
            id
            name
            ingredients
            directions
        }
    }
`