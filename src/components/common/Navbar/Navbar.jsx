import Link from 'next/link';
import Image from 'next/image';
import { BiChevronDown } from 'react-icons/bi';
import useSWR from 'swr'
import { SMART_CONTRACTS,RPC, } from '@constants/index';
import { JsonRpcProvider, Connection } from '@mysten/sui.js';
import { useEffect,useState } from "react";
//import { toast } from 'react-toastify';
import { formatAddress } from '@services/frontend';
import { BsSearch,BsBoxArrowRight,BsPersonBadge,BsFileImage } from 'react-icons/bs';
import { useWallet, ConnectModal,useAccountBalance } from '@suiet/wallet-kit';
import axios from 'axios';

const Logo = () => {
  return (
    <div className=''>
      <Image
        src="/assets/images/1.jpg"
        height={30}
        width={30}
        className="mr-2 inline-block rounded-full border-2 border-black "
        alt="currency"
      />
      <Link href="/" className='text-center font-bold uppercase'>Era Homi</Link>
    </div>);
};

const Navbar = () => {
const connection = new Connection(RPC);
const provider = new JsonRpcProvider(connection);
const { account,connected,disconnect } = useWallet();
//const [subscriptionId,setSubscriptionId] = useState();
const [showModal, setShowModal] = useState(false);
const [collections, setCollections] = useState([]);
const [filter, setFilter] = useState('');

const { loading,balance } = useAccountBalance();

 const { data  } = useSWR(
  'getHomiBalance',
  async () => {
    if (!account?.address) return;
    const object = await provider.getBalance({
      owner: account.address,coinType:SMART_CONTRACTS.COIN_TYPE
    }).catch((e) => console.log(e));
    return object.totalBalance/10**9;
  },
  {
    revalidateOnFocus: true,
    revalidateOnMount: true,
    refreshWhenHidden: false,
    refreshInterval: 10000,
  }
 );

  useEffect(() => {
  if (account?.address?.toString() === undefined) return;
  setShowModal(false)
  }, [account]);

  useEffect(() => {
  //subscribeToHistory();
  loadCollections();
  }, [true]);

  const loadCollections = () => {
    axios.get('/api/collections').then((response)=>{console.log(response?.data?.result);setCollections(response?.data?.result?.error == undefined ? response?.data?.result: [])}).catch((e)=>{console.log(e);});
  }

  const handleChange = event => {
    //setPrice(event.target.value);
    setFilter(event.target.value);
  };

  const Navigation = () => {
  return (
    <div className="flex flex-row gap-6">
      <div className="flex flex-row gap-6 pt-1.5 pl-6">
      
        <Link href="/explore" className="hover:text-secondary">
          Explore
        </Link> 
        <Link href="/staking" className="hover:text-secondary">
          Staking
        </Link>
        <div className="dropdown">
          <label tabIndex={0} className="cursor-pointer hover:text-secondary focus:text-secondary">
            Earn $Homi  <BiChevronDown className="inline-block align-top text-2xl" />
          </label>
          <ul tabIndex={0} className="dropdown-content menu rounded-2xl bg-[#252525] p-3">
            <li className="whitespace-nowrap">
              <Link href="/raffle" className="hover:text-secondary">
                Airdrop
              </Link>
            </li>
            <li className="whitespace-nowrap">
              <Link href="/raffle" className="hover:text-secondary">
               Raffle 
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="relative z-10 flex flex-row gap-7 pl-2 sm:pl-12 invisible sm:visible">
        <span className="absolute top-2.5 left-0 block h-4 w-0.5 bg-white opacity-60" />


        {!connected ?<button style={{padding:'0px',color:'white',width:'200px'}} onClick={()=>setShowModal(true)} className='btn-sm btn'>Connect Sui Wallet </button>
        :(
        <div className="dropdown dropdown-hover">
  

          <label  style={{padding:'5px',color:'white',backgroundColor:'#252525'}} className="flex items-center space-x-3 rounded">
                  <div className="avatar">
                    <div className="mask mask-squircle">
                      <img src="/assets/images/profile.png" style={{width:'20px',height:'20px'}} alt="Avatar Tailwind CSS Component" />
                    </div>
                  </div>
                  <div>
                  <div className="gradient-text text-sm font-medium">
                    <span className="font-bold">{formatAddress(account.address)} </span>
                    <BiChevronDown className="inline-block align-top text-2xl" /></div>
                    <div className="text-sm opacity-50">
                    <div className="gradient-text text-sm font-medium">
                    {(data||'')+ ' HOMI'} {' | '} {(loading?'':(parseInt(balance)/10**9)?.toFixed(2))+' SUI'}</div>
                      </div>
                  </div>
                </label>

        <div tabIndex={0} style={{backgroundColor:'#252525'}} className="dropdown-content menu  shadow bg-base-200 rounded-box w-[185px]">
         <li> <Link href="/my-item" className="hover:text-secondary font-bold">
         <BsPersonBadge className='m-2'/> My Profile
        </Link></li>
        <li> <Link href="/my-item" className="hover:text-secondary font-bold">
         <BsFileImage className='m-2'/> My Items
        </Link>
        </li>
         <li style={{borderTop:'1px solid gray'}}><a onClick={()=>disconnect()}> <BsBoxArrowRight className='m-2'/>Disconnect</a></li> 
        </div>
      </div>
      )}

      </div>
    </div>
  );
  };

  return (
    <div className="container mx-auto flex flex-row justify-between pl-4 pt-6">
      <div className="flex flex-row items-center gap-8">
        <Logo />
      </div>
      <div className="">
      <div className="dropdown dropdown-hover"> 
      <span className="relative mx-auto block w-full max-w-md rounded-full border border-white py-1">
                <input
                  type="text"
                  placeholder="Search NFTs, collections"
                  className="relative z-10 h-8 w-full rounded-full border-none bg-transparent px-8 align-top text-[15px]  outline-none"
                  onChange={handleChange}
                />
                <button className="absolute top-3 right-2 z-20 text-1xl text-white">
                  <BsSearch />
                </button>
              </span>
        <div tabIndex={0} style={{backgroundColor:'#323232'}} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-[240px]">
        {collections?.filter(collection=>collection.name.toLowerCase().includes(filter))?.slice(0,4)?.map((collection,key)=>(<li key={key}>
          <Link  href={"/collection/"+collection.collection_address+"?"} className="hover:text-secondary">
          <div className="flex items-center space-x-3">
                  <div className="avatar">
                    <div className="mask mask-squircle w-12 h-6">
                      <img src={collection.logo} alt="Avatar Tailwind CSS Component" />
                    </div>
                  </div>
                  <div>
                    <span className="font-bold">{collection.name}</span>
                  </div>
                </div>
        </Link>
        </li>))}
        </div>
      </div>
  
      </div>
      <Navigation/>
      <ConnectModal
      open={showModal}
      onOpenChange={(open) => setShowModal(open)}
      ></ConnectModal>
    </div>
  );
};

export default Navbar;


//,MoveEventField:{path:'item_id',value:id} 
/*const subscribeToHistory = async () => {
  console.log(subscriptionId);
  if(subscriptionId == undefined){
   await provider.subscribeEvent({
    filter: { Package: SMART_CONTRACTS.MARKETPLACE_CONTRACT },
    onMessage:(element)=>{
      let message = element?.type?.toString()?.split('::')[2]?.split('Event')[0] == 'Listing' 
                  ? 'Item listed by ' + formatAddress(element?.parsedJson?.seller): 
                  (element?.type?.toString()?.split('::')[2]?.split('Event')[0] == 'Buy' ?
                   'Item sold by ' + formatAddress(element?.parsedJson?.buyer):
                   (element?.type?.toString()?.split('::')[2]?.split('Event')[0] == 'ChangePrice' ?
                   'Item price changed by ' + formatAddress(element?.parsedJson?.seller):
                   'Item delisted by ' + formatAddress(element?.parsedJson?.seller)))
                  ;
      console.log(element?.sender,account?.address);
      if(element?.sender!=account?.address){
      toast.info(message, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      }
    }
  }
  ).catch((e) => {
    console.log('not Events!', e);
  });
  //console.log(Id);
  setSubscriptionId(subscriptionId);
  }
  //console.log(res?.data);
  //setEvents(res?.data);
};*/