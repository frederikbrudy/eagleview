# EagleView
__A Video Analysis Tool for Visualising and Querying Spatial Interactions of People and Devices__

_Frederik Brudy, Suppachai Suwanwatcharachat, Wenyu Zhang, Steven Houben, Nicolai Marquardt__

Publication at the 2018 ACM International Conference on Interactive Surfaces and Spaces (ACM ISS'18)

To study and understand group collaborations involving multiple handheld devices and large interactive displays, researchers frequently analyse video recordings of interaction studies to interpret people's interactions with each other and/or devices. Advances in ubicomp technologies allow researchers to record spatial information through sensors in addition to video material. However, the volume of video data and high number of coding parameters involved in such an interaction analysis makes this a time-consuming and labour-intensive process. We designed EagleView, which provides analysts with real-time visualisations during playback of videos and an accompanying data-stream of tracked interactions. Real-time visualisations take into account key proxemic dimensions, such as distance and orientation. Overview visualisations show people's position and movement over longer periods of time. EagleView also allows the user to query people's interactions with an easy-to-use visual interface. Results are highlighted on the video player's timeline, enabling quick review of relevant instances. Our evaluation with expert users showed that EagleView is easy to learn and use, and the visualisations allow analysts to gain insights into collaborative activities.

Cite as: _[Frederik Brudy, Suppachai Suwanwatcharachat, Wenyu Zhang, Steven Houben, and Nicolai Marquardt. 2018. EagleView: A Video Analysis Tool for Visualising and Querying Spatial Interactions of People and Devices. In Proceedings of the 2018 ACM International Conference on Interactive Surfaces and Spaces (ISS '18). ACM, New York, NY, USA, 61-72. DOI: https://doi.org/10.1145/3279778.3279795](https://doi.org/10.1145/3279778.3279795)_

[EagleView at the ACM Digital Library](https://dl.acm.org/citation.cfm?id=3279795) 

[Open access PDF](https://fbrudy.net/projects/eagleview-iss-2018)
 
## Status
Initial release for ISS'18 talk.

Updated version coming soon!

## To install
1. Download and install [node.js v6.11.x LTS](https://nodejs.org/en/download/) for your platform
2. Open command line
3. Go to root folder 
	```cd EagleViewVis```
4. Install node dependencies
	```npm install```
5. Start application
	```npm start```
6. Put videos in \public\videos
7. In browser, go to http://localhost:3000/eagleview_new.html
