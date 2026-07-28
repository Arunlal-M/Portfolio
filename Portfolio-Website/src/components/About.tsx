import "./styles/About.css";
import { HiOutlineChevronDoubleUp, HiOutlineChevronDoubleDown } from "react-icons/hi";

const About = () => {
  return (
    <div className="about-section" id="about">
      <div className="about-decor-top">
        <HiOutlineChevronDoubleUp className="decor-arrow up-arrow" />
      </div>
      <div className="about-me">
        <h2 className="title">
          ABOUT <span className="do-h2">ME</span>
        </h2>
        {/* <hr className="line" /> */}
        <p className="para">
          Software Engineer with around 2 years of experience architecting distributed backend systems, real-time architectures, and scalable cloud applications. Expert in RESTful microservices, high-availability databases, and CI/CD observability pipelines. Passionate about system design, cross-team collaboration, and building high-performance enterprise solutions.
        </p>
      </div>
      <div className="about-decor-bottom">
        <HiOutlineChevronDoubleDown className="decor-arrow down-arrow" />
      </div>
    </div>
  );
};

export default About;
