import { useState, useEffect } from "react";
import { JsonRpcProvider, Connection } from '@mysten/sui.js';
import { TransactionBlock } from "@mysten/sui.js";
import { SMART_CONTRACTS,RPC } from '@constants/index';
import { useWallet } from '@suiet/wallet-kit';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { toast } from 'react-toastify';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation'

export default function StakingPage() {
  const { account:currentAccount,signTransactionBlock, connected } = useWallet();
  const connection = new Connection(RPC);
  const [reward, setreward] = useState(0);
  const provider = new JsonRpcProvider(connection);

  const { reset:r1,trigger:t1 ,data: nfts , error, isMutating:isLoading,isValidating } = useSWRMutation(
    'getnfts',
    async () => {
      if (!currentAccount?.address) return;
      const nfts_objects = await provider.getOwnedObjects({
        owner: currentAccount.address, options: {  showContent: true,showDisplay: true },
        filter: {StructType:SMART_CONTRACTS.NFT_TYPE}
      }).catch(e=>console.log(e));
      
      return nfts_objects?.data;
    },
    {
      revalidate: true,
      populateCache: true,
    }
  );

  const { reset:r2,trigger:t2, data: staked , error:error2, isMutating:isLoading2,isValidating:isValidating2 } = useSWRMutation(
    'getstaked',
    async () => {
      if (!currentAccount?.address) return;
      const stakednfts_receipts_objects = await provider.getOwnedObjects({
        owner: currentAccount.address, options: { showDisplay: false, showContent: true },
        filter: {StructType:SMART_CONTRACTS.RECEIPT_TYPE}
      }).catch(e=>console.log(e));
      //const stakednfts_receipts_objects = objects?.data?.filter(object => object?.data?.content?.type == SMART_CONTRACTS.RECEIPT_TYPE);
      let stakednfts_addresses = [];
      stakednfts_receipts_objects?.data?.map((nft) => {
        stakednfts_addresses.push(nft.data.content.fields.nft_id);
      });
      const staked = await provider.multiGetObjects({
        ids: stakednfts_addresses, options: { showDisplay: true, showContent: true }
      }).catch(e=>console.log(e));
      stakednfts_receipts_objects?.data?.map((nft,i) => {
        stakednfts_addresses.push(nft.data.content.fields.nft_id);
        staked[i].data.content.fields.receiptId = nft.data.objectId;
        staked[i].data.content.fields.stakedAt = nft.data.content.fields.stakedAt;
        staked[i].data.content.fields.withdrawn_amount = nft.data.content.fields.withdrawn_amount;
        staked[i].data.content.fields.rarity = nft.data.content.fields.rarity;
      });
      return staked;
    },
    {
      revalidate: true,
      populateCache: true,
    }
  );

  const loadNFTs = async () => {
    let newreward = 0;
    staked.map((nft) => {
      let rnum = undefined;
      
      if(nft.data.content.fields.rarity=="Common")
        rnum = 10;
      else if(nft.data.content.fields.rarity=="Rare")
        rnum = 20;
      else if(nft.data.content.fields.rarity=="Epic")
        rnum = 50;
      else if(nft.data.content.fields.rarity=="Legendary")
        rnum = 100;
      let reward_tmp = ((((Date.now() - parseInt(nft.data.content.fields.stakedAt)) / 1000) * (rnum)) / 86400) - (nft.data.content.fields.withdrawn_amount / 10 ** 9);
      console.log(nft.data.content.fields.rarity,reward_tmp,nft.data.content.fields.stakedAt,Date.now());
      newreward = reward_tmp > 0 ? (newreward + reward_tmp) : 0
    });
    setreward(newreward.toString().substring(0,5));
    console.log(newreward);
  };
  
  useEffect(() => {
    if (staked === undefined) return;
    loadNFTs();
  }, [staked]);

  const claim = async () => {
    const tx = new TransactionBlock();
    staked.map((stake) => {
      let rnum = undefined;
      if(stake.data.content.fields.rarity=="Common")
        rnum = 10;
      else if(stake.data.content.fields.rarity=="Rare")
        rnum = 20;
      else if(stake.data.content.fields.rarity=="Epic")
        rnum = 50;
      else if(stake.data.content.fields.rarity=="Legendary")
        rnum = 100;
      let reward_tmp = ((((Date.now() - stake.data.content.fields.stakedAt) / 1000) * (rnum)) / 86400) - (stake.data.content.fields.withdrawn_amount / 10 ** 9);
      if(reward_tmp>0){
      tx.moveCall({
        target: SMART_CONTRACTS.CLAIM_FUNCTION,
        typeArguments: [SMART_CONTRACTS.COIN_TYPE, SMART_CONTRACTS.NFT_TYPE],
        arguments: [
          tx.object(SMART_CONTRACTS.VAULT_ADDRESS),
          tx.object(stake.data.content.fields.receiptId),
          tx.object(SMART_CONTRACTS.CLOCK_ADDRESS)
        ],
      });}
    });

      let toastId;
      signTransactionBlock({ transactionBlock: tx }).then(e=>{
        toastId = toast.loading("executing transaction...", {
          position: "top-center",
          autoClose: false,
          theme: "dark",
        });
        provider.executeTransactionBlock({ transactionBlock: e.transactionBlockBytes,signature:e.signature })
        .then(
          (res) => {
            console.log(res);
            toast.update(toastId, {
              render: "Rewards claimed successfully",
              type: toast.TYPE.SUCCESS,
              progress: undefined,
              hideProgressBar: true,
              autoClose: 5000,
              pauseOnFocusLoss: true,
              closeOnClick: true,
              isLoading: false
            });
            updateAll();
          }
        ).catch(
          (err) => {
            toast.update(toastId, {
              render: err.toString(),
              type: toast.TYPE.ERROR,
              progress: undefined,
              hideProgressBar: true,
              autoClose: 5000,
              pauseOnFocusLoss: true,
              closeOnClick: true,
              isLoading: false
            });
            //console.log(err);
          }
        );
      }).catch(
        (err) => {
          toast.update(toastId, {
            render: err.toString(),
            type: toast.TYPE.ERROR,
            progress: undefined,
            hideProgressBar: true,
            autoClose: 5000,
            pauseOnFocusLoss: true,
            closeOnClick: true,
            isLoading: false
          });
          //console.log(err);
        }
      )

  };

  const stakeNFT = async (objectId) => {
    //let address = wallet.account.address;
    const tx = new TransactionBlock();
    tx.moveCall({
      target: SMART_CONTRACTS.STAKE_FUNCTION,
      typeArguments:[SMART_CONTRACTS.COIN_TYPE,SMART_CONTRACTS.NFT_TYPE],
      arguments: [
        tx.object(SMART_CONTRACTS.VAULT_ADDRESS),
        tx.object(objectId),
        tx.object(SMART_CONTRACTS.CLOCK_ADDRESS)
      ],
    });
    let toastId;
    signTransactionBlock({ transactionBlock: tx }).then(e=>{
      toastId = toast.loading("executing transaction...", {
        position: "top-center",
        autoClose: false,
        theme: "dark",
      });
      provider.executeTransactionBlock({ transactionBlock: e.transactionBlockBytes,signature:e.signature })
      .then(
        (res) => {
          console.log(res);
          toast.update(toastId, {
            render: "NFT staked successfully",
            type: toast.TYPE.SUCCESS,
            progress: undefined,
            hideProgressBar: true,
            autoClose: 5000,
            pauseOnFocusLoss: true,
            closeOnClick: true,
            isLoading: false
          });
          updateAll();
        }
      ).catch(
        (err) => {
          toast.update(toastId, {
            render: err.toString(),
            type: toast.TYPE.ERROR,
            progress: undefined,
            hideProgressBar: true,
            autoClose: 5000,
            pauseOnFocusLoss: true,
            closeOnClick: true,
            isLoading: false
          });
          //console.log(err);
        }
      );
    }).catch(
      (err) => {
        toast.update(toastId, {
          render: err.toString(),
          type: toast.TYPE.ERROR,
          progress: undefined,
          hideProgressBar: true,
          autoClose: 5000,
          pauseOnFocusLoss: true,
          closeOnClick: true,
          isLoading: false
        });
        //console.log(err);
      }
    )
  };

  const unstakeNFT = async (objectId) => {
    //let address = wallet.account.address;
    const tx = new TransactionBlock();
    tx.moveCall({
      target: SMART_CONTRACTS.UNSTAKE_FUNCTION,
      typeArguments:[SMART_CONTRACTS.COIN_TYPE,SMART_CONTRACTS.NFT_TYPE],
      arguments: [
        tx.object(SMART_CONTRACTS.VAULT_ADDRESS),
        tx.object(objectId),
      ],
    });
    
    let toastId;
    signTransactionBlock({ transactionBlock: tx }).then(e=>{
      toastId = toast.loading("executing transaction...", {
        position: "top-center",
        autoClose: false,
        theme: "dark",
      });
      provider.executeTransactionBlock({ transactionBlock: e.transactionBlockBytes,signature:e.signature })
      .then(
        (res) => {
          console.log(res);
          toast.update(toastId, {
            render: "Unstaked successfully",
            type: toast.TYPE.SUCCESS,
            progress: undefined,
            hideProgressBar: true,
            autoClose: 5000,
            pauseOnFocusLoss: true,
            closeOnClick: true,
            isLoading: false
          });
          updateAll();
        }
      ).catch(
        (err) => {
          toast.update(toastId, {
            render: err.toString(),
            type: toast.TYPE.ERROR,
            progress: undefined,
            hideProgressBar: true,
            autoClose: 5000,
            pauseOnFocusLoss: true,
            closeOnClick: true,
            isLoading: false
          });
          //console.log(err);
        }
      );
    }).catch(
      (err) => {
        toast.update(toastId, {
          render: err.toString(),
          type: toast.TYPE.ERROR,
          progress: undefined,
          hideProgressBar: true,
          autoClose: 5000,
          pauseOnFocusLoss: true,
          closeOnClick: true,
          isLoading: false
        });
        //console.log(err);
      }
    )
  };

  const stakeAll = async () => {
    //let address = wallet.account.address;
    const tx = new TransactionBlock();
    nfts.map((nft)=>{
      tx.moveCall({
        target: SMART_CONTRACTS.STAKE_FUNCTION,
        typeArguments:[SMART_CONTRACTS.COIN_TYPE,SMART_CONTRACTS.NFT_TYPE],
        arguments: [
          tx.object(SMART_CONTRACTS.VAULT_ADDRESS),
          tx.object(nft.data.objectId),
          tx.object(SMART_CONTRACTS.CLOCK_ADDRESS)
        ],
      });
    })

    let toastId;
    signTransactionBlock({ transactionBlock: tx }).then(e=>{
      toastId = toast.loading("executing transaction...", {
        position: "top-center",
        autoClose: false,
        theme: "dark",
      });
      provider.executeTransactionBlock({ transactionBlock: e.transactionBlockBytes,signature:e.signature })
      .then(
        (res) => {
          console.log(res);
          toast.update(toastId, {
            render: "NFTs staked successfully",
            type: toast.TYPE.SUCCESS,
            progress: undefined,
            hideProgressBar: true,
            autoClose: 5000,
            pauseOnFocusLoss: true,
            closeOnClick: true,
            isLoading: false
          });
          updateAll();
        }
      ).catch(
        (err) => {
          toast.update(toastId, {
            render: err.toString(),
            type: toast.TYPE.ERROR,
            progress: undefined,
            hideProgressBar: true,
            autoClose: 5000,
            pauseOnFocusLoss: true,
            closeOnClick: true,
            isLoading: false
          });
          //console.log(err);
        }
      );
    }).catch(
      (err) => {
        toast.update(toastId, {
          render: err.toString(),
          type: toast.TYPE.ERROR,
          progress: undefined,
          hideProgressBar: true,
          autoClose: 5000,
          pauseOnFocusLoss: true,
          closeOnClick: true,
          isLoading: false
        });
        //console.log(err);
      }
    )
  };

  const unstakeAll= async () => {
    //let address = wallet.account.address;
    const tx = new TransactionBlock();
    staked.map((stake)=>{
      tx.moveCall({
        target: SMART_CONTRACTS.UNSTAKE_FUNCTION,
        typeArguments:[SMART_CONTRACTS.COIN_TYPE,SMART_CONTRACTS.NFT_TYPE],
        arguments: [
          tx.object(SMART_CONTRACTS.VAULT_ADDRESS),
          tx.object(stake.data.content.fields.receiptId),
        ],
      });
    });
   
    let toastId;
    signTransactionBlock({ transactionBlock: tx }).then(e=>{
      toastId = toast.loading("executing transaction...", {
        position: "top-center",
        autoClose: false,
        theme: "dark",
      });
      provider.executeTransactionBlock({ transactionBlock: e.transactionBlockBytes,signature:e.signature })
      .then(
        (res) => {
          console.log(res);
          toast.update(toastId, {
            render: "NFTs Unstaked successfully",
            type: toast.TYPE.SUCCESS,
            progress: undefined,
            hideProgressBar: true,
            autoClose: 5000,
            pauseOnFocusLoss: true,
            closeOnClick: true,
            isLoading: false
          });
          updateAll();
        }
      ).catch(
        (err) => {
          toast.update(toastId, {
            render: err.toString(),
            type: toast.TYPE.ERROR,
            progress: undefined,
            hideProgressBar: true,
            autoClose: 5000,
            pauseOnFocusLoss: true,
            closeOnClick: true,
            isLoading: false
          });
          //console.log(err);
        }
      );
    }).catch(
      (err) => {
        toast.update(toastId, {
          render: err.toString(),
          type: toast.TYPE.ERROR,
          progress: undefined,
          hideProgressBar: true,
          autoClose: 5000,
          pauseOnFocusLoss: true,
          closeOnClick: true,
          isLoading: false
        });
        //console.log(err);
      }
    )
  };

  useEffect(() => {
    if (currentAccount?.address?.toString() === undefined) return;
        t1();t2();    
  }, [currentAccount]);

  const Nfts = () => {
    if(error) return (<h3 className="mt-20 text-center text-base font-medium">
    Sui RPC issue while fetching tokens: {error}</h3>);
    if(!connected) return (<h3 className="mt-20 text-center text-base font-medium">
    Wallet Not connected </h3>);
    if(isLoading || isValidating) return (<h3 className="mt-20 text-center text-base font-medium">
    Loading Hominids...</h3>);
    return (
      <div>
        {nfts!=undefined && nfts?.length>0?<button className="btn mt-2 text-center" onClick={() => stakeAll()}>Stake All</button>:null}
        <div className="mt-12 grid grid-cols-4 gap-8">
          {nfts?.map((nft,i) => (
            <div key={i} className="inline-block rounded-2xl border border-[#9E8AA1]">
            <div className="relative">
              <Image
                 src={nft?.data?.display?.data?.image_url}
                 loader={() => nft?.data?.display?.data?.image_url}
                width={300}
                height={297}
                className="w-full rounded-2xl"
              />
              <button className="btn btn-md btn absolute bottom-0 right-0 z-10" onClick={()=>stakeNFT(nft?.data?.objectId)}>Stake</button>
            </div>
            <div className="p-4">
              <h2 className="text-base font-bold text-white">
                <Link href="">{nft?.data?.display?.data?.name}</Link>
              </h2>
            </div>
          </div>
          ))}
          
        </div>
      </div>);
  };

  const Staked = () => {
    if(error2) return (<h3 className="mt-20 text-center text-base font-medium">
    Sui RPC issue while fetching tokens</h3>);
    if(!connected) return (<h3 className="mt-20 text-center text-base font-medium">
    Wallet Not connected</h3>);
    if(isLoading2|| isValidating2) return (<h3 className="mt-20 text-center text-base font-medium">
    Loading Staked Hominids...</h3>);
    return (
      <div>
        {staked!=undefined && staked?.length>0?<button className="btn btn-connected mt-2 text-center" onClick={() => unstakeAll()}>Unstake All</button>:null}
        <div className="mt-12 grid grid-cols-4 gap-8">
          {staked?.map((stakedNft,i) => (          
            <div key={i} className="inline-block rounded-2xl border border-[#9E8AA1]">
            <div className="relative">
              <Image
                 src={stakedNft?.data?.display?.data?.image_url}
                 loader={() => stakedNft?.data?.display?.data?.image_url}
                 width={300}
                 height={297}
                 className="w-full rounded-2xl  blur-[2px]"
              />
              <button className="btn btn-md btn absolute bottom-0 right-0 z-10" onClick={()=>unstakeNFT(stakedNft.data.content.fields.receiptId)}>{"Unstake"}</button>
            </div>
            <div className="p-4">
              <h2 className="text-base font-bold text-white">
                <Link href="">{stakedNft?.data?.display?.data?.name}</Link>
              </h2>
            </div>
          </div>
          ))}
        </div>
      </div>);
  };

  const updateAll = () => {
   r1();r2();t1();t2();
  }

  const { data:stakingInfo  } = useSWR(
    'getStakedCountM',
    async () => {
      const object = await provider.getObject({
        id: SMART_CONTRACTS.VAULT_ADDRESS, options: { showDisplay: false, showContent: true }
      }).catch((e) => console.log(e));
      return object.data.content.fields;
    },
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      refreshWhenHidden: false,
      refreshInterval: 10000,
    }
  );

  

  return (
    <div className="mt-20">
      <h1 className="text-center text-5xl font-bold uppercase">Staking</h1>
      <h3 className="mt-2 text-center text-base font-medium">
        Earn $HOMI tokens staking your NFTs
      </h3>
      <div className="mt-8 flex w-full flex-row justify-around rounded-2xl bg-[#0c0c0c] p-6 text-center">
          <div>
            <p className="text-base capitalize text-gray">Total Hominids</p>
            <p className="mt-2 text-[18px] font-bold uppercase text-white">1017</p>
          </div>
          <div>
            <p className="text-base capitalize text-gray">Staked Hominids</p>
            <p className="mt-2 text-[18px] font-bold uppercase text-white">{stakingInfo?.staked_hominids}</p>
          </div>
          <div>
            <p className="text-base capitalize text-gray">Total Rewarded</p>
            <p className="mt-2 text-[18px] font-bold uppercase text-white">{((stakingInfo?.withdrawn_rewards)/10**9).toFixed(2)} HOMI</p>
          </div>
        </div>
      {reward > 0.5  ? <center><button className="btn mt-2 text-center" onClick={() => claim()}>Claim HOMI rewards</button></center> : null}
     <Tabs className="mt-14">
        <TabList className="tab-list">
          <Tab className="tab-title">Your Hominids</Tab>
          <Tab className="tab-title">Staked Hominids</Tab>
        </TabList>
         <TabPanel><Nfts /></TabPanel>
         <TabPanel><Staked /></TabPanel>
      </Tabs>
    </div>
  );
}
  /*setInterval(
      () => {
        stakednfts_receipts_objects_final.map((nft) => {
          let reward_tmp = ((((Date.now() - nft.data.content.fields.stakedAt) / 1000) * (3/2)) / 86400) - (nft.data.content.fields.withdrawn_amount / 10 ** 9);
          setreward(reward_tmp > 0 ? (reward + reward_tmp) : 0);
        });
      },
      2000

    );
    
     const deploy = async () => {
    //let address = wallet.account.address;
    const tx = new TransactionBlock();
    const rarirites = [
    
      
    ];
    rarirites.map((rarity)=>{
      let rnum = undefined;
      if(rarity[1]=="Common")
        rnum = 0;
      else if(rarity[1]=="Rare")
        rnum = 1;
      else if(rarity[1]=="Epic")
        rnum = 2;
      else if(rarity[1]=="Legendary")
        rnum = 3;

      tx.moveCall({
        target: "0x86fb9a85e3cfcc990f784ec8728bed55736adffea8c3b63f9dfb650957aabb40::staking::add_rarity",
        typeArguments:[SMART_CONTRACTS.COIN_TYPE,SMART_CONTRACTS.NFT_TYPE],
        arguments: [
          tx.object(SMART_CONTRACTS.VAULT_ADDRESS),
          tx.object(rarity[0]),
          tx.pure(rnum)
        ],
      });
    });
    
    let toastId;
    signTransactionBlock({ transactionBlock: tx }).then(e=>{
      toastId = toast.loading("executing transaction...", {
        position: "top-center",
        autoClose: false,
        theme: "dark",
      });
      provider.executeTransactionBlock({ transactionBlock: e.transactionBlockBytes,signature:e.signature })
      .then(
        (res) => {
          console.log(res);
          toast.update(toastId, {
            render: "Rarities deployed",
            type: toast.TYPE.SUCCESS,
            progress: undefined,
            hideProgressBar: true,
            autoClose: 5000,
            pauseOnFocusLoss: true,
            closeOnClick: true,
            isLoading: false
          });
          updateAll();
        }
      ).catch(
        (err) => {
          toast.update(toastId, {
            render: err.toString(),
            type: toast.TYPE.ERROR,
            progress: undefined,
            hideProgressBar: true,
            autoClose: 5000,
            pauseOnFocusLoss: true,
            closeOnClick: true,
            isLoading: false
          });
          //console.log(err);
        }
      );
    }).catch(
      (err) => {
        toast.update(toastId, {
          render: err.toString(),
          type: toast.TYPE.ERROR,
          progress: undefined,
          hideProgressBar: true,
          autoClose: 5000,
          pauseOnFocusLoss: true,
          closeOnClick: true,
          isLoading: false
        });
        //console.log(err);
      }
    )
  };
    */