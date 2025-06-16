import AppLayout from "../01 AppLayout/AppLayout";
import Register, { actionRegisterUser } from "../03 Register/Register";
import Login from "../02 Login/Login";
import HomePage from "../04 HomePage/HomePage";
import LandingPage from "../LandingPage/LandingPage";
import AllUsers from "../05 AllUsers/AllUsers";
// import Logout from "../06 Logout/Logout"; se declanseaza modalul, nu mai este necesara ruta separata
// import DeleteAccount from "../07 DeleteAccount/DeleteAccount"; se declanseaza modalul, nu mai este necesara ruta separata
import EditProfile, { actionEditProfile } from "../08 EditProfile/EditProfile";
import AddFlat, { actionAddFlat } from "../09 AddFlat/AddFlat";
import FlatDetails from "../10 FlatDetails/FlatDetails";
import EditFlat from "../11 EditFlat/EditFlat";
import MyFlats from "../12 MyFlats/MyFlats";
import Favourites from "../13 Favourites/Favourites";
import Error404 from "../Utils/Error404";
// import SessionEnded from "../Utils/SessionEnded"; se declanseaza modalul, nu mai este necesara ruta separata

// Placeholder temporar folosit pentru componentele care nu erau gata
// const TempPlaceholder = () => <div style={{padding: '2rem', textAlign: 'center'}}><h2>Component în dezvoltare...</h2></div>;

const RoutesStructure = [
    {
      path: '/', 
      element: <AppLayout/>,
      children: [
        {
          index: true, //routa default
          element: <LandingPage/>
        },
        {
          path: '/login',
          element: <Login/>
        },
        {
          path: '/register',
          element: <Register/>,
          action: actionRegisterUser,
        },
        { path: '/home', 
          element: <HomePage/>,
        },
        { path: '/all-users', 
          element: <AllUsers/> 
        },
        // { path: '/logout', 
        //   element: <TempPlaceholder/>
        // },
        // { path: '/delete-account', 
        // element: <DeleteAccount/> 
        // },
        { path: "/edit-profile/:id",
          element: <EditProfile />,
          action: actionEditProfile,
        },
        { path: '/add-flat', 
          element: <AddFlat/>, 
          action: actionAddFlat, 
        },
        { path: '/flat/:id', 
          element: <FlatDetails/> 
        },
        { path: '/edit-flat/:id', 
          element: <EditFlat/>, 
          // action: actionEditFlat, 
          // loader: loaderEditFlat, 
        },
        { path: '/my-flats', 
        element: <MyFlats/> 
        },
        { path: '/favourites', 
          element: <Favourites/>, 
        },
        // { path: '/logoutTimer',
        //   element: <SessionEnded/>,
        // },
        // Ruta explicita pentru erorile 404 ('/404')
        { path: '/404',
          element: <Error404/>,
        },
        // Redirectionare pentru rutele inexistente
        { path: '*',
          element: <Error404/>,
        },
      ]
    }
  ]

  export default RoutesStructure;