import Razorpay from "razorpay"

export async function POST(req) {

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })

  const body = await req.json()

  const options = {
    amount: body.amount * 100, 
    currency: "INR",
    receipt: "receipt_" + Date.now(),
  }

  try {

    const order = await razorpay.orders.create(options)

    return Response.json(order)

  } catch (error) {

    return Response.json({ error: "Payment order failed" }, { status: 500 })

  }
}