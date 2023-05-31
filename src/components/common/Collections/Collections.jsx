import React from 'react';
import { SectionTitle } from '@components/common';
import CollectionItem from './CollectionItem';
import axios from 'axios';
import { useState, useEffect } from "react";



export default function Collections({title}) {

  const [collections, setCollections] = useState([]);

  const loadCollections = () => {
     axios.get('/api/collections').then((response)=>{console.log(response.data.result);setCollections(response?.data?.result?.error == undefined ? response?.data?.result: [])}).catch((e)=>{console.log(e);});
  }

  useEffect(() => {
    loadCollections();
  }, []);

  return (
    <div className="mt-12">
      <SectionTitle title={title} des={"Explore "+title} />
      <div className="collections mt-7 gap-8 overflow-x-auto">
        {collections.map((collection,key)=><CollectionItem key={key} collection={{id:collection.collection_address,name:collection.name,image:collection.logo}}/>)}
      </div>
    </div>
  );
}
