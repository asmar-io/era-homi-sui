import { Category, Collections, Launchpad,Volumes, Trending } from '@components/common/';

export default function Home() {
  return (
    <>
      <Launchpad />
      
      <div className='mt-24' ><Collections title={"Trending Collections"}/></div>
      <Volumes />
      <Trending />
      <Category />
    </>
  );
}
