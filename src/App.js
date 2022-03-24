import React, { useState, useEffect } from 'react';
import { CssBaseline } from '@material-ui/core';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { Products, Navbar, Cart, Checkout } from './components';
import { commerce } from './lib/commerce';


const App = () => {
    // const [mobileOpen, setMobileOpen] = React.useState(false);
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState({});
    const [order, setOrder] = useState({});
    const [errorMessage, setErrorMessage] = useState('');

    const fetchProducts = async () => {
        const { data } = await commerce.products.list();
        setProducts(data);
    };

    const fetchCart = async () => {
        setCart(await commerce.cart.retrieve());
    };

    const handleAddToCart = async (productId, quantity) => {
        const item = await commerce.cart.add(productId, quantity);

        setCart(item.cart);
    };

    const handleUpdateCartQty = async (lineItemId, quantity) => {
        const response = await commerce.cart.update(lineItemId, { quantity });

        setCart(response.cart);
    };

    const handleRemoveCartQty = async (lineItemId) => {
        const response = await commerce.cart.remove(lineItemId);

        setCart(response.cart);
    };

    const handleEmptyCart = async () => {
        const response = await commerce.cart.empty();

        setCart(response.cart);
    };

    const refreshCart = async () => {
        const newCart = await commerce.cart.refresh();
    
        setCart(newCart);
    };
    
    const handleCaptureCheckout = async (stripe, checkoutTokenId, orderData) => {
        try {
          const incomingOrder = await commerce.checkout.capture(checkoutTokenId, orderData);
          
          setOrder(incomingOrder);
          
          refreshCart();
        } catch (error) {  
            if(error.data.error.type === 'requires_verification'){
              stripe.handleCardAction(error.data.error.param)
              .then(result => {
                if (result.error) {
                  setErrorMessage(result.error);
                  return;
                }
                commerce.checkout.capture(checkoutTokenId, {
                  ...orderData,
                  payment: {
                    ...orderData.payment,
                    stripe: {
                      payment_intent_id: result.paymentIntent.id,
                    }
                  },
                })
                  .then(response =>{
                    setOrder(response);
                    refreshCart();
                  })
                  .catch();
              })
            }
            else{
                setErrorMessage(error);
            }
        //   
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCart();
    }, []);

    
    return(
        <BrowserRouter>
            <div style={{ display: 'flex' }}>
                <CssBaseline />
                <Navbar totalItems={cart.total_items} />
                <Routes>
                    <Route path='/' element = {<Products products={products} onAddToCart = {handleAddToCart} />} />
                    <Route path='cart' element = {<Cart cart={cart} onUpdateCartQty = {handleUpdateCartQty} onRemoveFromCart = {handleRemoveCartQty} onEmptyCart = {handleEmptyCart} />} />
                    <Route path ='checkout' element = {<Checkout cart={cart} order={order} onCaptureCheckout={handleCaptureCheckout} error={errorMessage} />} />
                </Routes>
            </div>
        </BrowserRouter>
    )
}

export default App
