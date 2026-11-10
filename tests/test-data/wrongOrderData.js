export const wrongOrderDataCard = {
    shipping: {
        fullName: 'Atai Chynaliev',
        line1: '1963 playa st',
        line2: '',
        city: 'San Mateo',
        state: 'CA',
        postalCode: '94403',
        country: 'United States',
        phone: ''
    },
    payment: {
        nameOnCard: 'Atai Chynaliev',
        cardNumber: '4242 4242 4242 4000',
        expMonth: 10,
        expYear: 2027,
        cvc: '234'
    }
};

export const cardDataMissingOrderData = {
    shipping: {
        fullName: 'Atai Chynaliev',
        line1: '1963 playa st',
        line2: '',
        city: 'San Mateo',
        state: 'CA',
        postalCode: '94403',
        country: 'United States',
        phone: ''
    },
    payment: {
        nameOnCard: 'Atai Chynaliev',
        cardNumber: '4242 4242 4242 4242',
        expMonth: 10,
        expYear: 2027,
        cvc: ''
    }
};

export const shippingDataMissingOrderData = {
    shipping: {
        fullName: 'Atai Chynaliev',
        line1: '1963 playa st',
        line2: '',
        city: 'San Mateo',
        state: 'CA',
        postalCode: '',
        country: 'United States',
        phone: ''
    },
    payment: {
        nameOnCard: 'Atai Chynaliev',
        cardNumber: '4242 4242 4242 4242',
        expMonth: 10,
        expYear: 2027,
        cvc: '232'
    }
};