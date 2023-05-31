import { SectionTitle } from '@components/common/';
import CategoryItem from './CategoryItem';

export default function Category() {
  return (
    <div className="mt-32">
      <SectionTitle title="Latest sales" des="Explore the latest Hominids sales" />
      <div className="grid grid-cols-4 gap-7">
        <CategoryItem nftname={"Hominid #434"} imgurl={"/assets/images/hominid4.jpg"} nftprice={"18"}/>
        <CategoryItem nftname={"Hominid #744"} imgurl={"/assets/images/hominid2.png"} nftprice={"10"}/>
        <CategoryItem nftname={"Hominid #1374"} imgurl={"/assets/images/hominid3.png"} nftprice={"40"}/>
        <CategoryItem nftname={"Hominid #213"} imgurl={"/assets/images/hominid1.png"} nftprice={"20"}/>
      </div>
    </div>
  );
}
