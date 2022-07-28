# Snippets

Four built-in snippet shortcuts are available with the extension. Below you can see what snippet they generate.
Just type the highlighted text and vscode will provide a dropdown to insert the below snippet

## `admin` - Admin Check 
```rust
let admin = ADMIN.load(deps.storage)?;
if Some(info.sender) != admin {
   return Err(ContractError::Unauthorized {});
}
```

## `query` - New Query Function

```rust
fn query_do_something(deps: Deps) -> StdResult<SomeResponse> {
   let state = STATE.load(deps.storage)?;
   // ... insert logic here ...
   Ok(SomeResponse { })
}
```

## `tx` - New Msg Function

```rust
pub fn try_something(deps: DepsMut, info: MessageInfo) -> Result<Response, ContractError> {
   STATE.update(deps.storage, |mut state| -> Result<_, ContractError> {
       if info.sender != state.owner {
           return Err(ContractError::Unauthorized {});
       }
       // ... insert logic here ...
       Ok(state)
   })?;
   Ok(Response::new().add_attribute("method", "try_something"))
}
```

## `test` - New Empty Test Function 

```rust
#[test]
fn test_something() {
   let mut deps = mock_dependencies(&[]);
   let env = mock_env();
   let info = mock_info("creator", &coins(2, "token"));
   
   // ... arrange ...
   let msg = SomethingMsg { };
   
   // ... act ...
   let res = Something(deps.as_mut(), env, info, msg).unwrap();
   
   // ... assert ...
}
```
