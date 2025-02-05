import { SignIn } from '@clerk/nextjs'

export default function Page() {
  // return <SignIn />
  return (
    <div className='min-h-screen bg-[#1D232A] w-full flex justify-center items-center'>
      <SignIn />
    </div>
  )
}